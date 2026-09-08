import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class JwtUtilService {
  private readonly expirationMs: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.expirationMs = this.configService.get<number>('jwt.expirationMs');
  }

  generateToken(user: User): string {
    // "sub" é o e-mail do usuário, igual ao JwtUtil.generateToken original (usa userDetails.getUsername()).
    return this.jwtService.sign(
      { sub: user.email },
      { expiresIn: Math.floor(this.expirationMs / 1000) },
    );
  }

  /** Usado para definir o Max-Age do cookie httpOnly do access token. */
  getExpirationSeconds(): number {
    return Math.floor(this.expirationMs / 1000);
  }
}
