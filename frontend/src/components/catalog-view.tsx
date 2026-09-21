"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Play, SearchX, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api";
import { useCatalog, useDeleteContent, useMe, type CatalogFilters } from "@/lib/queries";
import type { ContentType } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AddContentDialog } from "@/components/add-content-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Poster } from "@/components/poster";

const PAGE_SIZE = 15;

export function CatalogView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data: user } = useMe();
  const isAdmin = user?.role === "ADMIN";
  const remove = useDeleteContent();

  // Os filtros vivem na URL: dá para compartilhar/voltar a uma busca.
  const filters: CatalogFilters = {
    titulo: params.get("titulo") || undefined,
    genero: params.get("genero") || undefined,
    ano: params.get("ano") ? Number(params.get("ano")) : undefined,
    tipo: (params.get("tipo") as ContentType | null) || undefined,
    page: Math.max(0, Number(params.get("page") ?? 0) || 0),
    size: PAGE_SIZE,
  };
  const { data, isPending, isError, isPlaceholderData } = useCatalog(filters);

  // Campos do formulário (aplicados ao enviar).
  const [titulo, setTitulo] = useState(filters.titulo ?? "");
  const [genero, setGenero] = useState(filters.genero ?? "");
  const [ano, setAno] = useState(filters.ano?.toString() ?? "");
  const [tipo, setTipo] = useState<string>(filters.tipo ?? "all");

  function navigate(next: Record<string, string | number | undefined>) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v !== undefined && v !== "" && v !== "all") qs.set(k, String(v));
    router.replace(qs.size ? `${pathname}?${qs}` : pathname);
  }

  function handleFilter(e: FormEvent) {
    e.preventDefault();
    navigate({ titulo: titulo.trim(), genero: genero.trim(), ano, tipo });
  }

  const goToPage = (page: number) =>
    navigate({ titulo: filters.titulo, genero: filters.genero, ano: filters.ano, tipo: filters.tipo, page: page || undefined });

  function handleDelete(id: number, name: string) {
    remove.mutate(id, {
      onSuccess: () => toast.success(`"${name}" excluído.`),
      onError: (e) => toast.error(errorMessage(e, "Não foi possível excluir.")),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Catálogo</h1>

      <form onSubmit={handleFilter} className="flex flex-col gap-2 lg:flex-row">
        <Input className="lg:flex-1" placeholder="Buscar por título..." aria-label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <Input className="lg:w-40" placeholder="Gênero" aria-label="Gênero" value={genero} onChange={(e) => setGenero(e.target.value)} />
        <Input className="lg:w-28" type="number" placeholder="Ano" aria-label="Ano" value={ano} onChange={(e) => setAno(e.target.value)} />
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="lg:w-36" aria-label="Tipo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="FILME">Filmes</SelectItem>
            <SelectItem value="SERIE">Séries</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">Filtrar</Button>
      </form>

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-busy="true">
          {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[2/3]" />)}
        </div>
      ) : isError ? (
        <Alert variant="destructive">Não foi possível carregar o catálogo.</Alert>
      ) : data.content.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-muted-foreground">
          <SearchX className="size-10" strokeWidth={1.25} />
          Nada encontrado
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${isPlaceholderData ? "opacity-60" : ""}`}>
            {data.content.map((item) => (
              <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-ring">
                <Link href={`/catalogo/${item.id}`} className="flex flex-1 flex-col outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  <div className="relative">
                    <Poster src={item.imagemUrl} title={item.titulo} className="aspect-[2/3] w-full" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Play className="size-5 fill-current" />
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3">
                    <strong className="line-clamp-1 text-sm">{item.titulo}</strong>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant={item.tipo === "FILME" ? "filme" : "serie"}>{item.tipo === "FILME" ? "Filme" : "Série"}</Badge>
                      {item.ano}
                    </span>
                    <Progress value={item.progresso} className="mt-1 h-1.5" />
                  </div>
                </Link>
                {isAdmin && (
                  <ConfirmDialog
                    title={`Excluir "${item.titulo}"?`}
                    description="Temporadas, episódios e o progresso de todos os usuários serão removidos. Essa ação não pode ser desfeita."
                    onConfirm={() => handleDelete(item.id, item.titulo)}
                    trigger={
                      <Button variant="destructive" size="icon-sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" title="Excluir título" aria-label={`Excluir ${item.titulo}`}>
                        <Trash2 />
                      </Button>
                    }
                  />
                )}
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={data.number === 0} onClick={() => goToPage(data.number - 1)}>Anterior</Button>
              <span className="text-sm text-muted-foreground">Página {data.number + 1} de {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={data.number + 1 >= data.totalPages} onClick={() => goToPage(data.number + 1)}>Próxima</Button>
            </div>
          )}
        </>
      )}

      {isAdmin && <AddContentDialog />}
    </div>
  );
}
