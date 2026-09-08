import { Injectable } from '@nestjs/common';
import { ContentType, ProgressStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly catalogService: CatalogService,
  ) {}

  async gerar(userEmail: string) {
    const user = await this.userService.findByEmail(userEmail);
    const userId = user.id;

    const totalFilmes = await this.prisma.content.count({ where: { tipo: ContentType.FILME } });
    const totalSeries = await this.prisma.content.count({ where: { tipo: ContentType.SERIE } });

    const episodiosAssistidos = await this.prisma.userProgress.count({
      where: { usuarioId: userId, status: ProgressStatus.ASSISTIDO, episodioId: { not: null } },
    });
    const filmesAssistidos = await this.prisma.userProgress.count({
      where: { usuarioId: userId, status: ProgressStatus.ASSISTIDO, conteudoId: { not: null } },
    });

    const episodiosAssistidosDetalhe = await this.prisma.userProgress.findMany({
      where: { usuarioId: userId, status: ProgressStatus.ASSISTIDO, episodioId: { not: null } },
      select: { episodio: { select: { duracaoMinutos: true } } },
    });
    const minutosAssistidos = episodiosAssistidosDetalhe.reduce(
      (soma, p) => soma + (p.episodio?.duracaoMinutos ?? 0),
      0,
    );
    const horasAssistidas = minutosAssistidos / 60.0;

    const series = await this.prisma.content.findMany({ where: { tipo: ContentType.SERIE } });
    let concluidas = 0;
    let emProgresso = 0;
    let naoIniciadas = 0;
    for (const serie of series) {
      const progresso = await this.catalogService.calcularProgressoSerie(serie.id, userId);
      if (progresso >= 100.0) concluidas++;
      else if (progresso > 0.0) emProgresso++;
      else naoIniciadas++;
    }

    const totalItens = totalFilmes + totalSeries;
    let progressoGeral = 0.0;
    if (totalItens > 0) {
      let acumulador = 0.0;
      const filmes = await this.prisma.content.findMany({ where: { tipo: ContentType.FILME } });
      for (const filme of filmes) {
        acumulador += await this.catalogService.calcularProgressoSerie(filme.id, userId);
      }
      for (const serie of series) {
        acumulador += await this.catalogService.calcularProgressoSerie(serie.id, userId);
      }
      progressoGeral = acumulador / totalItens;
    }

    const generosAgrupados = await this.prisma.content.groupBy({
      by: ['genero'],
      _count: { genero: true },
      where: { genero: { not: null } },
    });
    const distribuicaoPorGenero = generosAgrupados.map((row) => ({
      genero: row.genero,
      quantidade: row._count.genero,
    }));

    const ultimosAssistidos = await this.prisma.userProgress.findMany({
      where: { usuarioId: userId, status: ProgressStatus.ASSISTIDO, episodioId: { not: null } },
      orderBy: { atualizadoEm: 'desc' },
      take: 10,
      include: {
        episodio: {
          include: { temporada: { include: { conteudo: true } } },
        },
      },
    });

    const continuarAssistindo: Array<{
      conteudoId: number;
      tituloConteudo: string;
      imagemUrl: string | null;
      episodioId: number;
      numeroEpisodio: number;
      numeroTemporada: number;
      progressoSerie: number;
    }> = [];
    for (const p of ultimosAssistidos) {
      if (continuarAssistindo.length >= 5) break;
      if (!p.episodio) continue;
      const conteudoId = p.episodio.temporada.conteudo.id;
      continuarAssistindo.push({
        conteudoId,
        tituloConteudo: p.episodio.temporada.conteudo.titulo,
        imagemUrl: p.episodio.temporada.conteudo.imagemUrl,
        episodioId: p.episodio.id,
        numeroEpisodio: p.episodio.numero,
        numeroTemporada: p.episodio.temporada.numero,
        progressoSerie: await this.catalogService.calcularProgressoSerie(conteudoId, userId),
      });
    }

    return {
      totalFilmes,
      totalSeries,
      episodiosAssistidos,
      filmesAssistidos,
      progressoGeral,
      totalHorasAssistidas: horasAssistidas,
      seriesConcluidas: concluidas,
      seriesEmProgresso: emProgresso,
      seriesNaoIniciadas: naoIniciadas,
      distribuicaoPorGenero,
      continuarAssistindo,
    };
  }
}
