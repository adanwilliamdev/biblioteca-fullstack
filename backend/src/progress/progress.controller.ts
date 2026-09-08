import { Controller, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProgressStatus } from '@prisma/client';
import { ProgressService } from './progress.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('progress')
@Controller('api/progresso')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Put('episodios/:episodioId')
  marcarEpisodio(
    @Param('episodioId', ParseIntPipe) episodioId: number,
    @Query('status') status: ProgressStatus,
    @CurrentUser() user: User,
  ) {
    return this.progressService.marcarEpisodio(episodioId, status, user.email);
  }

  @Put('conteudos/:conteudoId')
  marcarFilme(
    @Param('conteudoId', ParseIntPipe) conteudoId: number,
    @Query('status') status: ProgressStatus,
    @CurrentUser() user: User,
  ) {
    return this.progressService.marcarFilme(conteudoId, status, user.email);
  }
}
