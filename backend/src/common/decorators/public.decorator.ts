import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca um handler ou controller como público (não exige JWT válido),
 * equivalente a `.requestMatchers("/api/auth/**").permitAll()` no SecurityConfig original.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
