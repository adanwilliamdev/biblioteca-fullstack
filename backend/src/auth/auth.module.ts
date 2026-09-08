import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtUtilService } from './jwt-util.service';
import { RefreshTokenService } from './refresh-token.service';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: Buffer.from(configService.get<string>('jwt.secret'), 'base64'),
        signOptions: { algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtUtilService, RefreshTokenService, JwtStrategy],
  exports: [JwtUtilService, RefreshTokenService],
})
export class AuthModule {}
