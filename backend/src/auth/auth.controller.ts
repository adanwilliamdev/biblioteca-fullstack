import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtUtilService } from './jwt-util.service';
import { RefreshTokenService } from './refresh-token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { User } from '@prisma/client';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

/**
 * Autenticação baseada em cookies httpOnly:
 *  - access_token: JWT de vida curta, enviado em toda requisição autenticada.
 *  - refresh_token: token opaco de vida longa, usado só em /api/auth/refresh
 *    para obter um novo access_token sem exigir novo login. É rotacionado
 *    (revogado e substituído) a cada uso.
 *
 * Nenhum dos dois tokens é devolvido no corpo JSON, apenas via Set-Cookie —
 * isso limita o impacto de um eventual XSS no frontend, já que JS não
 * consegue ler cookies httpOnly.
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  private readonly cookieSecure: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly jwtUtil: JwtUtilService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {
    this.cookieSecure = this.configService.get<boolean>('app.cookieSecure', false);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    try {
      const user = await this.userService.register(dto);
      await this.emitirCookies(user, response);
      response.status(HttpStatus.CREATED);
      return this.toAuthResponse(user);
    } catch (e) {
      if (e instanceof ConflictException) {
        response.status(HttpStatus.CONFLICT);
        return { message: e.message };
      }
      throw e;
    }
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    try {
      const user = await this.authService.validarCredenciais(dto.email, dto.senha);
      await this.emitirCookies(user, response);
      return this.toAuthResponse(user);
    } catch (e) {
      response.status(HttpStatus.UNAUTHORIZED);
      return { message: 'E-mail ou senha inválidos' };
    }
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshTokenValue = request.cookies?.[REFRESH_COOKIE];
    if (!refreshTokenValue) {
      response.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Sessão expirada, faça login novamente' };
    }
    try {
      const refreshToken = await this.refreshTokenService.validar(refreshTokenValue);
      // Rotação: o refresh token usado é revogado e um novo par é emitido.
      await this.refreshTokenService.revogar(refreshTokenValue);
      await this.emitirCookies(refreshToken.usuario, response);
      return this.toAuthResponse(refreshToken.usuario);
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        this.limparCookies(response);
        response.status(HttpStatus.UNAUTHORIZED);
        return { message: 'Sessão expirada, faça login novamente' };
      }
      throw e;
    }
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshTokenValue = request.cookies?.[REFRESH_COOKIE];
    if (refreshTokenValue) {
      await this.refreshTokenService.revogar(refreshTokenValue);
    }
    this.limparCookies(response);
  }

  private async emitirCookies(user: User, response: Response) {
    const accessToken = this.jwtUtil.generateToken(user);
    const refreshToken = await this.refreshTokenService.criar(user);

    response.cookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: this.jwtUtil.getExpirationSeconds() * 1000,
    });

    response.cookie(REFRESH_COOKIE, refreshToken.token, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: this.refreshTokenService.getExpirationSeconds() * 1000,
    });
  }

  private limparCookies(response: Response) {
    response.cookie(ACCESS_COOKIE, '', {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    response.cookie(REFRESH_COOKIE, '', {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  private toAuthResponse(user: User) {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    };
  }
}
