import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ContentType, ProgressStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { ContentRequestDto } from './dto/content-request.dto';
import { ListContentQueryDto } from './dto/list-content-query.dto';
import { SeasonRequestDto, EpisodeRequestDto } from './dto/season-episode-request.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async listar(query: ListContentQueryDto, userEmail: string) {
    const user = await this.userService.findByEmail(userEmail);

    const where: Prisma.ContentWhereInput = {};
    if (query.titulo?.trim()) {
      where.titulo = { contains: query.titulo, mode: 'insensitive' };
    }
    if (query.genero?.trim()) {
      where.genero = { equals: query.genero, mode: 'insensitive' };
    }
    if (query.ano !== undefined && query.ano !== null) {
      where.ano = query.ano;
    }
    if (query.tipo) {
      where.tipo = query.tipo;
    }

    const page = query.page ?? 0;
    const size = query.size ?? 15;

    const [totalElements, itens] = await this.prisma.$transaction([
      this.prisma.content.count({ where }),
      this.prisma.content.findMany({
        where,
        skip: page * size,
        take: size,
        orderBy: { id: 'asc' },
      }),
    ]);

    const ids = itens.map((c) => c.id);
    const progressoPorConteudo = await this.calcularProgressoEmLote(ids, user.id);

    return {
      content: itens.map((c) => this.toSummary(c, progressoPorConteudo.get(c.id) ?? 0)),
      totalElements,
      totalPages: Math.max(1, Math.ceil(totalElements / size)),
      number: page,
      size,
    };
  }

  private toSummary(content: any, progresso: number) {
    return {
      id: content.id,
      titulo: content.titulo,
      genero: content.genero,
      ano: content.ano,
      imagemUrl: content.imagemUrl,
      tipo: content.tipo,
      progresso,
    };
  }

  /**
   * Calcula o progresso (0-100) de uma lista de conteúdos para um usuário.
   * Equivalente a ContentService.calcularProgressoEmLote no backend Java.
   */
  private async calcularProgressoEmLote(conteudoIds: number[], userId: number): Promise<Map<number, number>> {
    const resultado = new Map<number, number>();
    if (conteudoIds.length === 0) return resultado;

    const episodios = await this.prisma.episode.findMany({
      where: { temporada: { conteudoId: { in: conteudoIds } } },
      select: { id: true, temporada: { select: { conteudoId: true } } },
    });
    const totalEpisodiosPorConteudo = new Map<number, number>();
    for (const ep of episodios) {
      const cId = ep.temporada.conteudoId;
      totalEpisodiosPorConteudo.set(cId, (totalEpisodiosPorConteudo.get(cId) ?? 0) + 1);
    }

    const progressosSeries = await this.prisma.userProgress.findMany({
      where: {
        usuarioId: userId,
        status: ProgressStatus.ASSISTIDO,
        episodio: { temporada: { conteudoId: { in: conteudoIds } } },
      },
      select: { episodio: { select: { temporada: { select: { conteudoId: true } } } } },
    });
    const assistidosPorConteudo = new Map<number, number>();
    for (const p of progressosSeries) {
      const cId = p.episodio.temporada.conteudoId;
      assistidosPorConteudo.set(cId, (assistidosPorConteudo.get(cId) ?? 0) + 1);
    }

    const progressosFilmes = await this.prisma.userProgress.findMany({
      where: { usuarioId: userId, conteudoId: { in: conteudoIds } },
      select: { conteudoId: true, status: true },
    });
    const statusFilmesPorConteudo = new Map<number, ProgressStatus>();
    for (const p of progressosFilmes) {
      if (p.conteudoId !== null && !statusFilmesPorConteudo.has(p.conteudoId)) {
        statusFilmesPorConteudo.set(p.conteudoId, p.status);
      }
    }

    for (const conteudoId of conteudoIds) {
      const totalEpisodios = totalEpisodiosPorConteudo.get(conteudoId);
      if (totalEpisodios && totalEpisodios > 0) {
        const assistidos = assistidosPorConteudo.get(conteudoId) ?? 0;
        resultado.set(conteudoId, (100.0 * assistidos) / totalEpisodios);
      } else {
        const status = statusFilmesPorConteudo.get(conteudoId);
        resultado.set(conteudoId, status === ProgressStatus.ASSISTIDO ? 100.0 : 0.0);
      }
    }
    return resultado;
  }

  async buscarDetalhes(id: number, userEmail: string) {
    const user = await this.userService.findByEmail(userEmail);
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException('Conteúdo não encontrado');
    }

    const base = {
      id: content.id,
      titulo: content.titulo,
      sinopse: content.sinopse,
      genero: content.genero,
      ano: content.ano,
      imagemUrl: content.imagemUrl,
      tipo: content.tipo,
    };

    if (content.tipo === ContentType.FILME) {
      const progresso = await this.prisma.userProgress.findFirst({
        where: { usuarioId: user.id, conteudoId: content.id },
      });
      const assistido = progresso?.status === ProgressStatus.ASSISTIDO;
      return { ...base, assistido, progresso: assistido ? 100.0 : 0.0 };
    }

    const temporadas = await this.prisma.season.findMany({
      where: { conteudoId: content.id },
      orderBy: { numero: 'asc' },
    });
    const seasonResponses = await Promise.all(temporadas.map((s) => this.toSeasonResponse(s.id, s, user.id)));
    const progresso = await this.calcularProgressoSerie(content.id, user.id);
    return { ...base, temporadas: seasonResponses, progresso };
  }

  private async toSeasonResponse(seasonId: number, season: { id: number; numero: number; titulo: string | null }, userId: number) {
    const episodios = await this.prisma.episode.findMany({
      where: { temporadaId: seasonId },
      orderBy: { numero: 'asc' },
    });
    const progressos = await this.prisma.userProgress.findMany({
      where: { usuarioId: userId, episodio: { temporadaId: seasonId }, status: ProgressStatus.ASSISTIDO },
      select: { episodioId: true },
    });
    const assistidosSet = new Set(progressos.map((p) => p.episodioId));

    const episodeResponses = episodios
      .map((ep) => ({
        id: ep.id,
        numero: ep.numero,
        titulo: ep.titulo,
        duracaoMinutos: ep.duracaoMinutos,
        assistido: assistidosSet.has(ep.id),
      }))
      .sort((a, b) => a.numero - b.numero);

    const progresso = episodios.length === 0 ? 0.0 : (100.0 * assistidosSet.size) / episodios.length;

    return {
      id: season.id,
      numero: season.numero,
      titulo: season.titulo,
      progresso,
      episodios: episodeResponses,
    };
  }

  async calcularProgressoSerie(conteudoId: number, userId: number): Promise<number> {
    const totalEpisodios = await this.prisma.episode.count({
      where: { temporada: { conteudoId } },
    });
    if (totalEpisodios === 0) {
      // pode ser filme
      const progresso = await this.prisma.userProgress.findFirst({
        where: { usuarioId: userId, conteudoId },
      });
      return progresso?.status === ProgressStatus.ASSISTIDO ? 100.0 : 0.0;
    }
    const assistidos = await this.prisma.userProgress.count({
      where: {
        usuarioId: userId,
        status: ProgressStatus.ASSISTIDO,
        episodio: { temporada: { conteudoId } },
      },
    });
    return (100.0 * assistidos) / totalEpisodios;
  }

  // ---------- CRUD (Admin) ----------

  async criar(dto: ContentRequestDto) {
    return this.prisma.content.create({
      data: {
        titulo: dto.titulo,
        sinopse: dto.sinopse,
        genero: dto.genero,
        ano: dto.ano,
        imagemUrl: dto.imagemUrl,
        tipo: dto.tipo,
        assistido: false,
      },
    });
  }

  async atualizar(id: number, dto: ContentRequestDto) {
    await this.garantirExiste(id);
    return this.prisma.content.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        sinopse: dto.sinopse,
        genero: dto.genero,
        ano: dto.ano,
        imagemUrl: dto.imagemUrl,
        tipo: dto.tipo,
      },
    });
  }

  async remover(id: number) {
    await this.garantirExiste(id);
    // O onDelete: Cascade no schema do Prisma cuida de remover temporadas,
    // episódios e progresso vinculados automaticamente.
    await this.prisma.content.delete({ where: { id } });
  }

  async adicionarTemporada(conteudoId: number, dto: SeasonRequestDto) {
    await this.garantirExiste(conteudoId);
    return this.prisma.season.create({
      data: { numero: dto.numero, titulo: dto.titulo, conteudoId },
    });
  }

  async removerTemporada(temporadaId: number) {
    const season = await this.prisma.season.findUnique({ where: { id: temporadaId } });
    if (!season) {
      throw new NotFoundException('Temporada não encontrada');
    }
    await this.prisma.season.delete({ where: { id: temporadaId } });
  }

  async adicionarEpisodio(temporadaId: number, dto: EpisodeRequestDto) {
    const season = await this.prisma.season.findUnique({ where: { id: temporadaId } });
    if (!season) {
      throw new NotFoundException('Temporada não encontrada');
    }
    return this.prisma.episode.create({
      data: { numero: dto.numero, titulo: dto.titulo, duracaoMinutos: dto.duracaoMinutos, temporadaId },
    });
  }

  async removerEpisodio(episodioId: number) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodioId } });
    if (!episode) {
      throw new NotFoundException('Episódio não encontrado');
    }
    await this.prisma.episode.delete({ where: { id: episodioId } });
  }

  private async garantirExiste(id: number) {
    const existe = await this.prisma.content.findUnique({ where: { id } });
    if (!existe) {
      throw new NotFoundException('Conteúdo não encontrado');
    }
  }
}
