import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SeasonRequestDto {
  @IsNotEmpty({ message: 'Número da temporada é obrigatório' })
  @IsInt()
  numero: number;

  @IsOptional()
  @IsString()
  titulo?: string;
}

export class EpisodeRequestDto {
  @IsNotEmpty({ message: 'Número do episódio é obrigatório' })
  @IsInt()
  numero: number;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsInt()
  duracaoMinutos?: number;
}
