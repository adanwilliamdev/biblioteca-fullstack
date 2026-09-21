"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, errorMessage } from "@/lib/api";
import {
  qk,
  useCatalog,
  useContent,
  useCreateContent,
  useDeleteContent,
  useRemoveEpisode,
  useRemoveSeason,
  useUpdateContent,
} from "@/lib/queries";
import type { ContentDetail, ContentPayload } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ContentForm } from "@/components/content-form";
import { AddEpisodeForm, AddSeasonForm } from "@/components/series-forms";

function SeriesManager({ contentId }: { contentId: number }) {
  const { data: content } = useContent(contentId);
  const removeSeason = useRemoveSeason();
  const removeEpisode = useRemoveEpisode();
  const fail = (m: string) => (e: unknown) => toast.error(errorMessage(e, m));

  if (!content) return <Skeleton className="h-40" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Temporadas de {content.titulo}</span>
          <Button variant="link" size="sm" asChild><Link href={`/catalogo/${content.id}`}>Abrir página</Link></Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AddSeasonForm contentId={content.id} />
        {content.temporadas?.map((season) => (
          <div key={season.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <strong>Temporada {season.numero}{season.titulo ? `: ${season.titulo}` : ""}</strong>
              <ConfirmDialog
                title="Remover temporada?"
                description="A temporada e todos os seus episódios serão removidos."
                confirmLabel="Remover"
                onConfirm={() => removeSeason.mutate(season.id, { onError: fail("Não foi possível remover a temporada.") })}
                trigger={<Button variant="ghost" size="sm" className="text-destructive">Remover temporada</Button>}
              />
            </div>
            <ul className="divide-y text-sm">
              {season.episodios.map((ep) => (
                <li key={ep.id} className="flex items-center justify-between py-1.5">
                  <span>Ep. {ep.numero}{ep.titulo ? ` · ${ep.titulo}` : ""}{ep.duracaoMinutos ? ` (${ep.duracaoMinutos} min)` : ""}</span>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeEpisode.mutate(ep.id, { onError: fail("Não foi possível remover o episódio.") })}>Remover</Button>
                </li>
              ))}
              {season.episodios.length === 0 && <li className="py-1.5 text-muted-foreground">Nenhum episódio.</li>}
            </ul>
            <AddEpisodeForm seasonId={season.id} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminView() {
  const qc = useQueryClient();
  const { data, isPending } = useCatalog({ size: 100 });
  const create = useCreateContent();
  const update = useUpdateContent();
  const remove = useDeleteContent();

  const [editing, setEditing] = useState<{ id: number; payload: ContentPayload } | null>(null);
  const [managingId, setManagingId] = useState<number | null>(null);

  async function startEdit(id: number) {
    // A listagem não traz a sinopse: busca o detalhe para não sobrescrevê-la com vazio ao salvar.
    try {
      const d = await qc.fetchQuery({ queryKey: qk.content(id), queryFn: () => api<ContentDetail>(`/catalog/${id}`), staleTime: 0 });
      setEditing({
        id,
        payload: { titulo: d.titulo, tipo: d.tipo, genero: d.genero, ano: d.ano, imagemUrl: d.imagemUrl, sinopse: d.sinopse },
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(errorMessage(e, "Não foi possível carregar o conteúdo para edição."));
    }
  }

  function handleSubmit(payload: ContentPayload) {
    const onError = (e: unknown) => toast.error(errorMessage(e, "Não foi possível salvar o conteúdo."));
    if (editing) {
      update.mutate({ id: editing.id, payload }, {
        onSuccess: () => { toast.success("Conteúdo atualizado."); setEditing(null); },
        onError,
      });
    } else {
      create.mutate(payload, { onSuccess: () => toast.success("Conteúdo criado."), onError });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Administração</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card>
          <CardHeader><CardTitle>{editing ? "Editar conteúdo" : "Adicionar conteúdo"}</CardTitle></CardHeader>
          <CardContent>
            {/* key força o formulário a reiniciar ao trocar entre criar/editar */}
            <ContentForm
              key={editing?.id ?? "new"}
              initial={editing?.payload}
              submitLabel={editing ? "Salvar alterações" : "Adicionar"}
              pending={create.isPending || update.isPending}
              onSubmit={handleSubmit}
              onCancel={editing ? () => setEditing(null) : undefined}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conteúdos cadastrados</CardTitle></CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-48" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Ano</TableHead><TableHead>Gênero</TableHead><TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-56 truncate font-medium">{item.titulo}</TableCell>
                      <TableCell><Badge variant={item.tipo === "FILME" ? "filme" : "serie"}>{item.tipo === "FILME" ? "Filme" : "Série"}</Badge></TableCell>
                      <TableCell>{item.ano ?? "-"}</TableCell>
                      <TableCell className="max-w-40 truncate">{item.genero ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" title="Editar" aria-label={`Editar ${item.titulo}`} onClick={() => startEdit(item.id)}><Pencil /></Button>
                          {item.tipo === "SERIE" && (
                            <Button variant="ghost" size="icon-sm" title="Gerenciar temporadas" aria-label={`Gerenciar temporadas de ${item.titulo}`} onClick={() => setManagingId(item.id)}><Settings2 /></Button>
                          )}
                          <ConfirmDialog
                            title={`Excluir "${item.titulo}"?`}
                            description="Temporadas, episódios e o progresso de todos os usuários serão removidos. Essa ação não pode ser desfeita."
                            onConfirm={() =>
                              remove.mutate(item.id, {
                                onSuccess: () => {
                                  toast.success("Conteúdo excluído.");
                                  if (managingId === item.id) setManagingId(null);
                                  if (editing?.id === item.id) setEditing(null);
                                },
                                onError: (e) => toast.error(errorMessage(e, "Não foi possível excluir.")),
                              })
                            }
                            trigger={<Button variant="ghost" size="icon-sm" title="Excluir" aria-label={`Excluir ${item.titulo}`}><Trash2 className="text-destructive" /></Button>}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.content.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum conteúdo cadastrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            {data && data.totalElements > data.content.length && (
              <p className="mt-3 text-xs text-muted-foreground">Mostrando os primeiros {data.content.length} de {data.totalElements}. Use o catálogo para ver os demais.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {managingId !== null && <SeriesManager contentId={managingId} />}
    </div>
  );
}
