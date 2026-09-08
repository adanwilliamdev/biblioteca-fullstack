import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TmdbService } from './tmdb.service';
import { TmdbSearchQueryDto, TmdbImportQueryDto } from './dto/tmdb-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('tmdb')
@Controller('api/tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('status')
  status() {
    return { configurado: this.tmdbService.isConfigured() };
  }

  @Get('search')
  buscar(@Query() query: TmdbSearchQueryDto) {
    return this.tmdbService.buscar(query.query, query.tipo);
  }

  @Post('import')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  importar(@Query() query: TmdbImportQueryDto) {
    return this.tmdbService.importar(query.tmdbId, query.tipo);
  }
}
