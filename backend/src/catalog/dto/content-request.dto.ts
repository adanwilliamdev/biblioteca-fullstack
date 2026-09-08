import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentType } from '@prisma/client';

export class ContentRequestDto {
  @IsNotEmpty({ message: 'Título é obrigatório' })
  titulo: string;

  @IsOptional()
  @IsString()
  sinopse?: string;

  @IsOptional()
  @IsString()
  genero?: string;

  @IsOptional()
  @IsInt()
  ano?: number;

  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @IsNotEmpty({ message: 'Tipo é obrigatório (FILME ou SERIE)' })
  @IsEnum(ContentType, { message: 'Tipo é obrigatório (FILME ou SERIE)' })
  tipo: ContentType;
}
