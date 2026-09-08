import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface TmdbSearchResult {
  tmdbId: number;
  titulo: string;
  ano: number | null;
  imagemUrl: string | null;
  sinopse: string | null;
  tipo: ContentType;
  avaliacao: number | null;
}

interface TmdbImportResult {
  conteudoId: number;
  titulo: string;
  temporadasImportadas: number;
  episodiosImportadas: number;
}

/**
 * Cacheia buscas repetidas (mesmo termo + tipo) em memória, evitando bater na
 * API do TMDB toda vez que o usuário reabre a mesma pesquisa.
 * Equivalente ao @Cacheable(value = "tmdbBusca", ...) do backend Java.
 */
class BuscaCache {
  private readonly store = new Map<string, { valor: TmdbSearchResult[]; expiraEm: number }>();
  private readonly ttlMs = 10 * 60 * 1000; // 10 minutos

  get(chave: string): TmdbSearchResult[] | undefined {
    const item = this.store.get(chave);
    if (!item) return undefined;
    if (Date.now() > item.expiraEm) {
      this.store.delete(chave);
      return undefined;
    }
    return item.valor;
  }

  set(chave: string, valor: TmdbSearchResult[]) {
    this.store.set(chave, { valor, expiraEm: Date.now() + this.ttlMs });
  }
}

@Injectable()
export class TmdbService {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly imageBaseUrl: string;
  private readonly cache = new BuscaCache();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('tmdb.apiKey');
    this.baseUrl = this.configService.get<string>('tmdb.baseUrl');
    this.imageBaseUrl = this.configService.get<string>('tmdb.imageBaseUrl');
    this.http = axios.create({ timeout: 8000 });
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== '';
  }

  async buscar(query: string, tipo: ContentType): Promise<TmdbSearchResult[]> {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Integração com o TMDB não configurada. Defina a variável de ambiente TMDB_API_KEY.',
      );
    }

    const chaveCache = `${tipo}-${query.toLowerCase()}`;
    const emCache = this.cache.get(chaveCache);
    if (emCache) return emCache;

    const path = tipo === ContentType.FILME ? '/search/movie' : '/search/tv';
    const { data } = await this.http.get(`${this.baseUrl}${path}`, {
      params: {
        api_key: this.apiKey,
        language: 'pt-BR',
        query,
        include_adult: false,
      },
    });

    const resultados: TmdbSearchResult[] = (data?.results ?? [])
      .slice(0, 20)
      .map((node: any) => this.toSearchResult(node, tipo));

    this.cache.set(chaveCache, resultados);
    return resultados;
  }

  private toSearchResult(node: any, tipo: ContentType): TmdbSearchResult {
    const titulo = tipo === ContentType.FILME ? node.title : node.name;
    const dataLancamento = tipo === ContentType.FILME ? node.release_date : node.first_air_date;

    let ano: number | null = null;
    if (dataLancamento && dataLancamento.length >= 4) {
      const parsed = parseInt(dataLancamento.substring(0, 4), 10);
      if (!Number.isNaN(parsed)) ano = parsed;
    }

    const imagemUrl = node.poster_path ? this.imageBaseUrl + node.poster_path : null;

    return {
      tmdbId: node.id,
      titulo: titulo || 'Sem título',
      ano,
      imagemUrl,
      sinopse: node.overview || null,
      tipo,
      avaliacao: typeof node.vote_average === 'number' ? node.vote_average : null,
    };
  }

  async importar(tmdbId: number, tipo: ContentType): Promise<TmdbImportResult> {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Integração com o TMDB não configurada. Defina a variável de ambiente TMDB_API_KEY.',
      );
    }

    const path = tipo === ContentType.FILME ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    let details: any;
    try {
      const response = await this.http.get(`${this.baseUrl}${path}`, {
        params: { api_key: this.apiKey, language: 'pt-BR' },
      });
      details = response.data;
    } catch {
      details = null;
    }
    if (!details) {
      throw new BadRequestException('Não foi possível encontrar este título no TMDB');
    }

    const titulo = tipo === ContentType.FILME ? details.title : details.name;
    const dataLancamento = tipo === ContentType.FILME ? details.release_date : details.first_air_date;
    let ano: number | null = null;
    if (dataLancamento && dataLancamento.length >= 4) {
      const parsed = parseInt(dataLancamento.substring(0, 4), 10);
      if (!Number.isNaN(parsed)) ano = parsed;
    }

    let genero: string | null = null;
    if (Array.isArray(details.genres)) {
      genero = details.genres.map((g: any) => g.name).join(', ');
    }

    const imagemUrl = details.poster_path ? this.imageBaseUrl + details.poster_path : null;

    const content = await this.prisma.content.create({
      data: {
        titulo: titulo || 'Sem título',
        sinopse: details.overview || null,
        genero,
        ano,
        imagemUrl,
        tipo,
        assistido: false,
      },
    });

    let temporadasImportadas = 0;
    let episodiosImportadas = 0;

    if (tipo === ContentType.SERIE && Array.isArray(details.seasons)) {
      for (const seasonNode of details.seasons) {
        const seasonNumber = seasonNode.season_number;
        const season = await this.prisma.season.create({
          data: { numero: seasonNumber, titulo: seasonNode.name || null, conteudoId: content.id },
        });
        temporadasImportadas++;
        episodiosImportadas += await this.importarEpisodios(tmdbId, seasonNumber, season.id);
      }
    }

    return {
      conteudoId: content.id,
      titulo: content.titulo,
      temporadasImportadas,
      episodiosImportadas,
    };
  }

  private async importarEpisodios(tmdbId: number, seasonNumber: number, seasonId: number): Promise<number> {
    let seasonDetails: any;
    try {
      const response = await this.http.get(`${this.baseUrl}/tv/${tmdbId}/season/${seasonNumber}`, {
        params: { api_key: this.apiKey, language: 'pt-BR' },
      });
      seasonDetails = response.data;
    } catch {
      return 0;
    }

    if (!seasonDetails || !Array.isArray(seasonDetails.episodes)) {
      return 0;
    }

    let count = 0;
    for (const episodeNode of seasonDetails.episodes) {
      await this.prisma.episode.create({
        data: {
          numero: episodeNode.episode_number,
          titulo: episodeNode.name || null,
          duracaoMinutos: typeof episodeNode.runtime === 'number' ? episodeNode.runtime : null,
          temporadaId: seasonId,
        },
      });
      count++;
    }
    return count;
  }
}
