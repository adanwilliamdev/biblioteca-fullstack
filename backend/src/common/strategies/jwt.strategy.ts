import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserService } from '../../user/user.service';

const ACCESS_COOKIE_NAME = 'access_token';

/**
 * Lê o JWT preferencialmente do cookie httpOnly "access_token" (usado pelo
 * frontend web). Mantém compatibilidade com o header "Authorization: Bearer"
 * para clientes de API (Swagger, integrações externas, testes).
 * Equivalente a JwtAuthFilter.extrairToken() no backend Java.
 */
function extractJwtFromRequest(req: Request): string | null {
  if (req?.cookies?.[ACCESS_COOKIE_NAME]) {
    return req.cookies[ACCESS_COOKIE_NAME];
  }
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: Buffer.from(configService.get<string>('jwt.secret'), 'base64'),
    });
  }

  async validate(payload: { sub: string }) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    // payload.sub é o e-mail do usuário (subject do JWT), igual ao JwtUtil.generateToken original.
    const user = await this.userService.findByEmailOrNull(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { senha, ...userSemSenha } = user;
    return userSemSenha;
  }
}
