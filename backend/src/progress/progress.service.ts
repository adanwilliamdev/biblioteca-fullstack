import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly catalogService: CatalogService,
  ) {}

  async marcarEpisodio(episodioId: number, status: ProgressStatus, userEmail: string) {
    const user = await this.userService.findByEmail(userEmail);
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodioId },
      include: { temporada: true },
    });
    if (!episode) {
      throw new NotFoundException('Episódio não encontrado');
    }

    const existente = await this.prisma.userProgress.findUnique({
      where: { usuarioId_episodioId: { usuarioId: user.id, episodioId } },
    });

    if (existente) {
      await this.prisma.userProgress.update({
        where: { id: existente.id },
        data: { status, atualizadoEm: new Date() },
      });
    } else {
      await this.prisma.userProgress.create({
        data: { usuarioId: user.id, episodioId, status, atualizadoEm: new Date() },
      });
    }

    const conteudoId = episode.temporada.conteudoId;
    const temporadaId = episode.temporada.id;

    const totalTemporada = await this.prisma.episode.count({ where: { temporadaId } });
    const assistidosTemporada = await this.prisma.userProgress.count({
      where: { usuarioId: user.id, status: ProgressStatus.ASSISTIDO, episodio: { temporadaId } },
    });
    const progressoTemporada = totalTemporada === 0 ? 0.0 : (100.0 * assistidosTemporada) / totalTemporada;

    const progressoSerie = await this.catalogService.calcularProgressoSerie(conteudoId, user.id);

    return {
      episodioId,
      conteudoId,
      status,
      progressoTemporada,
      progressoSerie,
    };
  }

  async marcarFilme(conteudoId: number, status: ProgressStatus, userEmail: string) {
    const user = await this.userService.findByEmail(userEmail);
    const content = await this.prisma.content.findUnique({ where: { id: conteudoId } });
    if (!content) {
      throw new NotFoundException('Conteúdo não encontrado');
    }

    const existente = await this.prisma.userProgress.findFirst({
      where: { usuarioId: user.id, conteudoId },
    });

    if (existente) {
      await this.prisma.userProgress.update({
        where: { id: existente.id },
        data: { status, atualizadoEm: new Date() },
      });
    } else {
      await this.prisma.userProgress.create({
        data: { usuarioId: user.id, conteudoId, status, atualizadoEm: new Date() },
      });
    }

    const progresso = status === ProgressStatus.ASSISTIDO ? 100.0 : 0.0;
    return {
      conteudoId,
      status,
      progressoTemporada: progresso,
      progressoSerie: progresso,
    };
  }
}
