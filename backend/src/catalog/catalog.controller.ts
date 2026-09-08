import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CatalogService } from './catalog.service';
import { ContentRequestDto } from './dto/content-request.dto';
import { ListContentQueryDto } from './dto/list-content-query.dto';
import { SeasonRequestDto, EpisodeRequestDto } from './dto/season-episode-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '@prisma/client';

@ApiTags('catalog')
@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  listar(@Query() query: ListContentQueryDto, @CurrentUser() user: User) {
    return this.catalogService.listar(query, user.email);
  }

  @Get(':id')
  detalhes(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.catalogService.buscarDetalhes(id, user.email);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dto: ContentRequestDto) {
    return this.catalogService.criar(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: ContentRequestDto) {
    return this.catalogService.atualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.remover(id);
  }

  @Post(':id/temporadas')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  adicionarTemporada(@Param('id', ParseIntPipe) id: number, @Body() dto: SeasonRequestDto) {
    return this.catalogService.adicionarTemporada(id, dto);
  }

  @Delete('temporadas/:temporadaId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removerTemporada(@Param('temporadaId', ParseIntPipe) temporadaId: number) {
    return this.catalogService.removerTemporada(temporadaId);
  }

  @Post('temporadas/:temporadaId/episodios')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  adicionarEpisodio(@Param('temporadaId', ParseIntPipe) temporadaId: number, @Body() dto: EpisodeRequestDto) {
    return this.catalogService.adicionarEpisodio(temporadaId, dto);
  }

  @Delete('episodios/:episodioId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removerEpisodio(@Param('episodioId', ParseIntPipe) episodioId: number) {
    return this.catalogService.removerEpisodio(episodioId);
  }
}
