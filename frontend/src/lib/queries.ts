"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type {
  ContentDetail,
  ContentPayload,
  ContentSummary,
  ContentType,
  DashboardData,
  PageResponse,
  ProgressStatus,
  TmdbImportResult,
  TmdbSearchResult,
  UserProfile,
} from "@/lib/types";

export const qk = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  catalog: (filters?: CatalogFilters) => ["catalog", filters ?? {}] as const,
  content: (id: number) => ["content", id] as const,
  tmdbStatus: ["tmdb", "status"] as const,
  tmdbSearch: (query: string, tipo: ContentType) => ["tmdb", "search", tipo, query] as const,
};

/** Dados que dependem do progresso do usuário ou do catálogo. */
function invalidateLibrary(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["catalog"] }),
    qc.invalidateQueries({ queryKey: ["content"] }),
    qc.invalidateQueries({ queryKey: qk.dashboard }),
  ]);
}

// ---------- autenticação ----------

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      try {
        return await api<UserProfile>("/users/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { email: string; senha: string }) =>
      api<UserProfile>("/auth/login", { method: "POST", json: v, skipRefresh: true }),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { nome: string; email: string; senha: string }) =>
      api<UserProfile>("/auth/register", { method: "POST", json: v, skipRefresh: true }),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST", skipRefresh: true }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(qk.me, null);
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nome: string) => api<UserProfile>("/users/me", { method: "PUT", json: { nome } }),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

// ---------- leitura ----------

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: () => api<DashboardData>("/dashboard") });
}

export interface CatalogFilters {
  titulo?: string;
  genero?: string;
  ano?: number;
  tipo?: ContentType;
  page?: number;
  size?: number;
}

export function useCatalog(filters: CatalogFilters) {
  return useQuery({
    queryKey: qk.catalog(filters),
    queryFn: () =>
      api<PageResponse<ContentSummary>>("/catalog", { params: { ...filters } }),
    placeholderData: keepPreviousData,
  });
}

export function useContent(id: number) {
  return useQuery({
    queryKey: qk.content(id),
    queryFn: () => api<ContentDetail>(`/catalog/${id}`),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

// ---------- progresso (com atualização otimista) ----------

export function useMarkEpisode(contentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { episodeId: number; status: ProgressStatus }) =>
      api(`/progresso/episodios/${v.episodeId}`, { method: "PUT", params: { status: v.status } }),
    onMutate: async ({ episodeId, status }) => {
      await qc.cancelQueries({ queryKey: qk.content(contentId) });
      const previous = qc.getQueryData<ContentDetail>(qk.content(contentId));
      if (previous?.temporadas) {
        qc.setQueryData<ContentDetail>(qk.content(contentId), {
          ...previous,
          temporadas: previous.temporadas.map((s) => ({
            ...s,
            episodios: s.episodios.map((e) =>
              e.id === episodeId ? { ...e, assistido: status === "ASSISTIDO" } : e,
            ),
          })),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.content(contentId), ctx.previous);
    },
    onSettled: () => invalidateLibrary(qc),
  });
}

export function useMarkMovie(contentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ProgressStatus) =>
      api(`/progresso/conteudos/${contentId}`, { method: "PUT", params: { status } }),
    onSettled: () => invalidateLibrary(qc),
  });
}

// ---------- administração ----------

export function useCreateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContentPayload) => api("/catalog", { method: "POST", json: payload }),
    onSuccess: () => invalidateLibrary(qc),
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; payload: ContentPayload }) =>
      api(`/catalog/${v.id}`, { method: "PUT", json: v.payload }),
    onSuccess: () => invalidateLibrary(qc),
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/catalog/${id}`, { method: "DELETE" }),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.content(id) });
      return invalidateLibrary(qc);
    },
  });
}

export function useAddSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { contentId: number; numero: number; titulo: string | null }) =>
      api(`/catalog/${v.contentId}/temporadas`, {
        method: "POST",
        json: { numero: v.numero, titulo: v.titulo },
      }),
    onSuccess: () => invalidateLibrary(qc),
  });
}

export function useRemoveSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seasonId: number) => api(`/catalog/temporadas/${seasonId}`, { method: "DELETE" }),
    onSuccess: () => invalidateLibrary(qc),
  });
}

export function useAddEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      seasonId: number;
      numero: number;
      titulo: string | null;
      duracaoMinutos: number | null;
    }) =>
      api(`/catalog/temporadas/${v.seasonId}/episodios`, {
        method: "POST",
        json: { numero: v.numero, titulo: v.titulo, duracaoMinutos: v.duracaoMinutos },
      }),
    onSuccess: () => invalidateLibrary(qc),
  });
}

export function useRemoveEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (episodeId: number) => api(`/catalog/episodios/${episodeId}`, { method: "DELETE" }),
    onSuccess: () => invalidateLibrary(qc),
  });
}

// ---------- TMDB ----------

export function useTmdbStatus(enabled: boolean) {
  return useQuery({
    queryKey: qk.tmdbStatus,
    queryFn: () => api<{ configurado: boolean }>("/tmdb/status"),
    enabled,
    staleTime: 10 * 60_000,
  });
}

export function useTmdbSearch(query: string, tipo: ContentType) {
  return useQuery({
    queryKey: qk.tmdbSearch(query, tipo),
    queryFn: () => api<TmdbSearchResult[]>("/tmdb/search", { params: { query, tipo } }),
    enabled: query.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useImportTmdb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { tmdbId: number; tipo: ContentType }) =>
      api<TmdbImportResult>("/tmdb/import", { method: "POST", params: v }),
    onSuccess: () => invalidateLibrary(qc),
  });
}
