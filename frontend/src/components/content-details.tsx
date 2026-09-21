"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiError, errorMessage } from "@/lib/api";
import {
  useContent,
  useDeleteContent,
  useMarkEpisode,
  useMarkMovie,
  useMe,
  useRemoveEpisode,
  useRemoveSeason,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Poster } from "@/components/poster";
import { AddEpisodeForm, AddSeasonForm } from "@/components/series-forms";

export function ContentDetails({ id }: { id: number }) {
  const router = useRouter();
  const { data: user } = useMe();
  const isAdmin = user?.role === "ADMIN";
  const { data: content, isPending, error } = useContent(id);

  const markEpisode = useMarkEpisode(id);
  const markMovie = useMarkMovie(id);
  const deleteContent = useDeleteContent();
  const removeSeason = useRemoveSeason();
  const removeEpisode = useRemoveEpisode();

  const [expanded, setExpanded] = useState<Set<number> | null>(null);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [episodeFormFor, setEpisodeFormFor] = useState<number | null>(null);

  if (isPending) {
    return (
      <div className="flex flex-col gap-6 sm:flex-row" aria-busy="true">
        <Skeleton className="aspect-[2/3] w-48 shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="space-y-4">
        <Alert variant={notFound ? "default" : "destructive"}>
          {notFound ? "Conteúdo não encontrado." : "Não foi possível carregar este título."}
        </Alert>
        <Button variant="outline" asChild><Link href="/catalogo"><ChevronLeft /> Voltar ao catálogo</Link></Button>
      </div>
    );
  }

  // Por padrão só a primeira temporada vem aberta.
  const open = expanded ?? new Set(content.temporadas?.[0] ? [content.temporadas[0].id] : []);
  const toggleSeason = (seasonId: number) => {
    const next = new Set(open);
    if (!next.delete(seasonId)) next.add(seasonId);
    setExpanded(next);
  };

  const fail = (fallback: string) => (e: unknown) => toast.error(errorMessage(e, fallback));

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/catalogo"><ChevronLeft /> Catálogo</Link>
      </Button>

      <div className="flex flex-col gap-6 sm:flex-row">
        <Poster src={content.imagemUrl} title={content.titulo} className="aspect-[2/3] w-44 shrink-0 self-start rounded-xl border sm:w-52" />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold">{content.titulo}</h1>
            {isAdmin && (
              <ConfirmDialog
                title={`Excluir "${content.titulo}"?`}
                description="Temporadas, episódios e o progresso de todos os usuários serão removidos. Essa ação não pode ser desfeita."
                onConfirm={() =>
                  deleteContent.mutate(content.id, {
                    onSuccess: () => {
                      toast.success("Título excluído.");
                      router.replace("/catalogo");
                    },
                    onError: fail("Não foi possível excluir."),
                  })
                }
                trigger={<Button variant="outline" size="icon" title="Excluir título" aria-label="Excluir título"><Trash2 className="text-destructive" /></Button>}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={content.tipo === "FILME" ? "filme" : "serie"}>{content.tipo === "FILME" ? "Filme" : "Série"}</Badge>
            {[content.ano, content.genero].filter(Boolean).join(" · ")}
          </div>

          <p className="max-w-prose leading-relaxed text-muted-foreground">{content.sinopse || "Sem sinopse cadastrada."}</p>

          <div className="max-w-md space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progresso</span>
              <span>{content.progresso.toFixed(0)}%</span>
            </div>
            <Progress value={content.progresso} className="h-2.5" />
          </div>

          {content.tipo === "FILME" && (
            <div>
              <Button
                variant={content.assistido ? "secondary" : "default"}
                disabled={markMovie.isPending}
                onClick={() => markMovie.mutate(content.assistido ? "PENDENTE" : "ASSISTIDO", { onError: fail("Não foi possível atualizar o progresso.") })}
              >
                {content.assistido ? "Marcar como não assistido" : "Marcar como assistido"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {content.tipo === "SERIE" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Temporadas</h2>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setShowSeasonForm((v) => !v)}>
                {showSeasonForm ? "Cancelar" : "Adicionar temporada"}
              </Button>
            )}
          </div>

          {isAdmin && showSeasonForm && <AddSeasonForm contentId={content.id} onDone={() => setShowSeasonForm(false)} />}

          {content.temporadas?.length === 0 && (
            <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
              {isAdmin ? "Esta série ainda não tem temporadas. Use “Adicionar temporada” para começar." : "Esta série ainda não tem temporadas cadastradas."}
            </p>
          )}

          <div className="space-y-3">
            {content.temporadas?.map((season) => {
              const isOpen = open.has(season.id);
              return (
                <div key={season.id} className="rounded-xl border bg-card">
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => toggleSeason(season.id)}
                      aria-expanded={isOpen}
                      className="flex flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <ChevronDown className={cn("size-4 shrink-0 transition-transform", !isOpen && "-rotate-90")} />
                      <span className="flex-1 font-medium">Temporada {season.numero}{season.titulo ? `: ${season.titulo}` : ""}</span>
                      <span className="text-sm text-muted-foreground">{season.progresso.toFixed(0)}%</span>
                    </button>
                    {isAdmin && (
                      <ConfirmDialog
                        title="Remover temporada?"
                        description="A temporada e todos os seus episódios serão removidos."
                        confirmLabel="Remover"
                        onConfirm={() => removeSeason.mutate(season.id, { onError: fail("Não foi possível remover a temporada.") })}
                        trigger={<Button variant="ghost" size="sm" className="text-destructive">Remover</Button>}
                      />
                    )}
                  </div>
                  <Progress value={season.progresso} className="mx-3 mb-3 h-1.5 w-auto" />

                  {isOpen && (
                    <div className="border-t px-3 py-2">
                      <ul>
                        {season.episodios.map((ep) => (
                          <li key={ep.id} className="flex items-center gap-3 rounded-md px-1 py-2 hover:bg-accent/50">
                            <Checkbox
                              id={`ep-${ep.id}`}
                              checked={ep.assistido}
                              onCheckedChange={() => markEpisode.mutate({ episodeId: ep.id, status: ep.assistido ? "PENDENTE" : "ASSISTIDO" }, { onError: fail("Não foi possível atualizar o progresso.") })}
                            />
                            <label htmlFor={`ep-${ep.id}`} className={cn("flex-1 cursor-pointer text-sm", ep.assistido && "text-muted-foreground line-through")}>
                              Ep. {ep.numero}{ep.titulo ? ` · ${ep.titulo}` : ""}
                              {ep.duracaoMinutos ? <span className="text-muted-foreground"> ({ep.duracaoMinutos} min)</span> : null}
                            </label>
                            {isAdmin && (
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeEpisode.mutate(ep.id, { onError: fail("Não foi possível remover o episódio.") })}>
                                Remover
                              </Button>
                            )}
                          </li>
                        ))}
                        {season.episodios.length === 0 && (
                          <li className="py-2 text-sm text-muted-foreground">Nenhum episódio cadastrado nesta temporada.</li>
                        )}
                      </ul>

                      {isAdmin && (
                        <div className="pt-2">
                          {episodeFormFor === season.id ? (
                            <AddEpisodeForm seasonId={season.id} onDone={() => setEpisodeFormFor(null)} />
                          ) : (
                            <Button variant="link" size="sm" className="px-0" onClick={() => setEpisodeFormFor(season.id)}>
                              Adicionar episódio
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
