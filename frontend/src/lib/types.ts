export type ContentType = "FILME" | "SERIE";
export type ProgressStatus = "ASSISTIDO" | "PENDENTE";
export type Role = "USER" | "ADMIN";

export interface UserProfile {
  id: number;
  nome: string;
  email: string;
  role: Role;
}

export interface ContentSummary {
  id: number;
  titulo: string;
  genero: string | null;
  ano: number | null;
  imagemUrl: string | null;
  tipo: ContentType;
  progresso: number;
}

export interface EpisodeItem {
  id: number;
  numero: number;
  titulo: string | null;
  duracaoMinutos: number | null;
  assistido: boolean;
}

export interface SeasonItem {
  id: number;
  numero: number;
  titulo: string | null;
  progresso: number;
  episodios: EpisodeItem[];
}

export interface ContentDetail {
  id: number;
  titulo: string;
  sinopse: string | null;
  genero: string | null;
  ano: number | null;
  imagemUrl: string | null;
  tipo: ContentType;
  progresso: number;
  assistido: boolean | null;
  temporadas: SeasonItem[] | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DashboardData {
  totalFilmes: number;
  totalSeries: number;
  episodiosAssistidos: number;
  filmesAssistidos: number;
  progressoGeral: number;
  totalHorasAssistidas: number;
  seriesConcluidas: number;
  seriesEmProgresso: number;
  seriesNaoIniciadas: number;
  distribuicaoPorGenero: { genero: string; quantidade: number }[];
  continuarAssistindo: {
    conteudoId: number;
    tituloConteudo: string;
    imagemUrl: string | null;
    episodioId: number;
    numeroEpisodio: number;
    numeroTemporada: number;
    progressoSerie: number;
  }[];
}

/** Payload de criação/edição de conteúdo (campos vazios vão como null). */
export interface ContentPayload {
  titulo: string;
  sinopse: string | null;
  genero: string | null;
  ano: number | null;
  imagemUrl: string | null;
  tipo: ContentType;
}

export interface TmdbSearchResult {
  tmdbId: number;
  titulo: string;
  ano: number | null;
  imagemUrl: string | null;
  sinopse: string | null;
  tipo: ContentType;
  avaliacao: number | null;
}

export interface TmdbImportResult {
  conteudoId: number;
  titulo: string;
  temporadasImportadas: number;
  episodiosImportados: number;
}
