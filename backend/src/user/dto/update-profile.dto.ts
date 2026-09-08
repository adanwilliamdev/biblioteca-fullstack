import { IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;
}
