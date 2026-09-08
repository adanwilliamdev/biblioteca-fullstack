import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Equivalente ao GlobalExceptionHandler.java (@RestControllerAdvice):
 * - erros de validação (class-validator) -> 400 com mapa de erros por campo
 * - NotFoundException -> 404
 * - ForbiddenException -> 403, mensagem genérica
 * - qualquer outro erro -> 500, mensagem genérica (detalhe completo só no log do servidor)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof NotFoundException) {
      return this.build(response, HttpStatus.NOT_FOUND, this.extractMessage(exception));
    }

    if (exception instanceof ForbiddenException) {
      return this.build(response, HttpStatus.FORBIDDEN, 'Você não tem permissão para executar esta ação');
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      // Erros de validação do ValidationPipe (class-validator) chegam aqui como
      // BadRequestException com um array de mensagens em `message`.
      if (status === HttpStatus.BAD_REQUEST && typeof body === 'object' && Array.isArray((body as any).message)) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          timestamp: new Date().toISOString(),
          status: HttpStatus.BAD_REQUEST,
          erros: (body as any).message,
        });
      }

      return this.build(response, status, this.extractMessage(exception));
    }

    // Loga o detalhe completo (com stacktrace) apenas no servidor.
    // O cliente recebe uma mensagem genérica para não vazar informações internas.
    this.logger.error('Erro inesperado ao processar requisição', (exception as Error)?.stack);
    return this.build(
      response,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    );
  }

  private extractMessage(exception: HttpException): string {
    const body = exception.getResponse();
    if (typeof body === 'string') return body;
    if (typeof body === 'object' && (body as any).message) {
      const msg = (body as any).message;
      return Array.isArray(msg) ? msg.join(', ') : msg;
    }
    return exception.message;
  }

  private build(response: Response, status: number, message: string) {
    response.status(status).json({
      timestamp: new Date().toISOString(),
      status,
      message,
    });
  }
}
