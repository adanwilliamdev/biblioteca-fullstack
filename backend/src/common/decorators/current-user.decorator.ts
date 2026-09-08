import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Equivalente a receber `Authentication authentication` nos controllers do Spring
 * e chamar `authentication.getName()`. Aqui devolvemos o usuário completo (sem a senha),
 * já carregado pela JwtStrategy.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
