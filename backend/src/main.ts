import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

/**
 * Converte um padrão com wildcard (ex: "http://localhost:*") em uma RegExp,
 * equivalente ao `setAllowedOriginPatterns` usado no CorsConfigurationSource original.
 */
function origemPermitida(padroes: string[], origin: string): boolean {
  return padroes.some((padrao) => {
    const regex = new RegExp('^' + padrao.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return regex.test(origin);
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const allowedOrigins = configService.get<string[]>('app.cors.allowedOrigins');
  app.enableCors({
    origin: (origin, callback) => {
      // Requisições sem origin (ex: curl, apps mobile) são permitidas, igual ao comportamento
      // padrão do Spring quando não há header Origin.
      if (!origin || origemPermitida(allowedOrigins, origin)) {
        return callback(null, true);
      }
      return callback(new Error('Não permitido pelo CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: '*',
  });

  const config = new DocumentBuilder()
    .setTitle('Biblioteca API')
    .setDescription('API da Biblioteca (filmes e séries) — conversão Node.js/NestJS')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui.html', app, document, {
    jsonDocumentUrl: 'v3/api-docs',
  });

  const port = configService.get<number>('port', 8080);
  await app.listen(port);
}

bootstrap();
