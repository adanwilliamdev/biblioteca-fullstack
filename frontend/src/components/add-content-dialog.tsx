"use client";

import { useState, type FormEvent } from "react";
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api";
import { useCreateContent, useImportTmdb, useTmdbSearch, useTmdbStatus } from "@/lib/queries";
import type { ContentType } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentForm } from "@/components/content-form";
import { Poster } from "@/components/poster";

function TmdbTab({ onDone }: { onDone: () => void }) {
  const status = useTmdbStatus(true);
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [tipo, setTipo] = useState<ContentType>("FILME");
  const search = useTmdbSearch(term, tipo);
  const importer = useImportTmdb();
  const [importingId, setImportingId] = useState<number | null>(null);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setTerm(input.trim());
  }

  function handleImport(tmdbId: number, titulo: string) {
    setImportingId(tmdbId);
    importer.mutate(
      { tmdbId, tipo },
      {
        onSuccess: (r) => {
          toast.success(
            tipo === "SERIE"
              ? `"${r.titulo}" importada: ${r.temporadasImportadas} temporadas, ${r.episodiosImportados} episódios.`
              : `"${r.titulo}" importado.`,
          );
          onDone();
        },
        onError: (e) => toast.error(errorMessage(e, `Não foi possível importar "${titulo}".`)),
        onSettled: () => setImportingId(null),
      },
    );
  }

  if (status.data && !status.data.configurado) {
    return <Alert>A integração com o TMDB não está configurada (defina TMDB_API_KEY no servidor). Use o cadastro manual.</Alert>;
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input placeholder="Buscar título..." value={input} onChange={(e) => setInput(e.target.value)} autoFocus />
        <Select value={tipo} onValueChange={(v) => setTipo(v as ContentType)}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FILME">Filme</SelectItem>
            <SelectItem value="SERIE">Série</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={search.isFetching}>{search.isFetching ? "Buscando..." : "Buscar"}</Button>
      </form>

      {search.isError && <Alert variant="destructive">{errorMessage(search.error, "Não foi possível buscar no TMDB agora.")}</Alert>}
      {search.data?.length === 0 && <Alert>Nenhum resultado para essa busca.</Alert>}

      <ul className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
        {search.data?.map((item) => (
          <li key={item.tmdbId} className="flex gap-3 rounded-lg border bg-muted/50 p-2">
            <Poster src={item.imagemUrl} title={item.titulo} className="h-24 w-16 shrink-0 rounded-md text-[10px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <strong className="truncate">{item.titulo}</strong>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {item.ano ?? "Ano desconhecido"}
                {item.avaliacao ? (<><Star className="size-3 fill-current text-chart-6" /> {item.avaliacao.toFixed(1)}</>) : null}
              </span>
              {item.sinopse && <p className="line-clamp-2 text-xs text-muted-foreground">{item.sinopse}</p>}
            </div>
            <Button size="sm" className="self-center" onClick={() => handleImport(item.tmdbId, item.titulo)} disabled={importer.isPending}>
              {importingId === item.tmdbId ? "Importando..." : "Importar"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AddContentDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateContent();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="fixed right-5 bottom-5 z-30 h-12 rounded-full px-5 shadow-lg" aria-label="Adicionar título">
          <Plus /> Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar filme ou série</DialogTitle>
          <DialogDescription>Importe do TMDB ou cadastre manualmente.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="tmdb">
          <TabsList>
            <TabsTrigger value="tmdb">Buscar no TMDB</TabsTrigger>
            <TabsTrigger value="manual">Cadastro manual</TabsTrigger>
          </TabsList>
          <TabsContent value="tmdb">
            <TmdbTab onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="manual">
            <ContentForm
              submitLabel="Adicionar"
              pending={create.isPending}
              onSubmit={(payload) =>
                create.mutate(payload, {
                  onSuccess: () => {
                    toast.success("Título adicionado.");
                    setOpen(false);
                  },
                  onError: (e) => toast.error(errorMessage(e, "Não foi possível adicionar este conteúdo.")),
                })
              }
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
