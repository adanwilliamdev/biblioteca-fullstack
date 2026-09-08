import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting simples, em memória, para os endpoints de autenticação
 * (login e registro), para dificultar ataques de força bruta / enumeração de e-mails.
 *
 * Implementação por IP com janela deslizante. É uma proteção de baixo custo para uma
 * aplicação single-instance; não substitui uma solução distribuída (ex: Redis) caso a
 * aplicação venha a rodar em múltiplas instâncias atrás de um load balancer.
 *
 * Equivalente a AuthRateLimitFilter.java.
 */
@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  // Limite defensivo de memória: numa aplicação pequena, isso nunca deveria ser
  // atingido organicamente; serve só para não deixar o mapa crescer sem controle
  // em caso de um ataque distribuído (muitos IPs diferentes).
  private static readonly MAX_IPS_RASTREADOS = 10_000;

  private readonly tentativasPorIp = new Map<string, number[]>();
  private readonly janelaMs: number;
  private readonly maxTentativas: number;

  constructor(private readonly configService: ConfigService) {
    this.janelaMs = this.configService.get<number>('rateLimit.janelaMs', 60_000);
    this.maxTentativas = this.configService.get<number>('rateLimit.maxTentativas', 10);
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.isEndpointSensivel(req)) {
      return next();
    }

    const ip = this.extrairIp(req);
    const agora = Date.now();

    if (this.tentativasPorIp.size > AuthRateLimitMiddleware.MAX_IPS_RASTREADOS) {
      this.tentativasPorIp.clear();
    }

    const tentativas = this.tentativasPorIp.get(ip) ?? [];
    const dentroDaJanela = tentativas.filter((t) => agora - t <= this.janelaMs);

    if (dentroDaJanela.length >= this.maxTentativas) {
      this.tentativasPorIp.set(ip, dentroDaJanela);
      res.status(429).json({ message: 'Muitas tentativas. Aguarde um instante e tente novamente.' });
      return;
    }

    dentroDaJanela.push(agora);
    this.tentativasPorIp.set(ip, dentroDaJanela);
    next();
  }

  private isEndpointSensivel(req: Request): boolean {
    return req.method === 'POST' && (req.path.endsWith('/api/auth/login') || req.path.endsWith('/api/auth/register'));
  }

  private extrairIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim() !== '') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip;
  }
}
