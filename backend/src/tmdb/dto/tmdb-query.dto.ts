import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { ContentType } from '@prisma/client';

export class TmdbSearchQueryDto {
  @IsNotEmpty()
  query: string;

  @IsEnum(ContentType)
  tipo: ContentType;
}

export class TmdbImportQueryDto {
  @Type(() => Number)
  @IsInt()
  tmdbId: number;

  @IsEnum(ContentType)
  tipo: ContentType;
}
