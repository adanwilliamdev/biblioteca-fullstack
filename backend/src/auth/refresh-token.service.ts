import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshToken, User } from '@prisma/client';

@Injectable()
export class RefreshTokenService {
  private readonly refreshExpirationMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpirationMs = this.configService.get<number>('jwt.refreshExpirationMs');
  }

  async criar(usuario: User): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        token: this.gerarTokenAleatorio(),
        usuarioId: usuario.id,
        expiraEm: new Date(Date.now() + this.refreshExpirationMs),
        revogado: false,
      },
    });
  }

  /**
   * Valida um refresh token (existe, não foi revogado e não expirou).
   * Lança UnauthorizedException caso contrário — o chamador deve tratar isso
   * como "sessão expirada, faça login novamente".
   */
  async validar(token: string): Promise<RefreshToken & { usuario: User }> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { usuario: true },
    });
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (refreshToken.revogado || refreshToken.expiraEm.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado ou revogado');
    }
    return refreshToken;
  }

  async revogar(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revogado: true },
    });
  }

  /**
   * Revoga todos os refresh tokens de um usuário (ex: ao trocar a senha, ou
   * "sair de todos os dispositivos").
   */
  async revogarTodosDoUsuario(usuarioId: number): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { usuarioId } });
  }

  getExpirationSeconds(): number {
    return Math.floor(this.refreshExpirationMs / 1000);
  }

  private gerarTokenAleatorio(): string {
    return randomUUID() + randomUUID();
  }
}
