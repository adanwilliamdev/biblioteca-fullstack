"use client";

import { useState, type FormEvent } from "react";

import type { ContentPayload, ContentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const EMPTY_CONTENT: ContentPayload = {
  titulo: "",
  sinopse: null,
  genero: null,
  ano: null,
  imagemUrl: null,
  tipo: "FILME",
};

/** Formulário de filme/série, usado no cadastro manual e na edição (admin). */
export function ContentForm({
  initial = EMPTY_CONTENT,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: ContentPayload;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (payload: ContentPayload) => void;
  onCancel?: () => void;
}) {
  const [titulo, setTitulo] = useState(initial.titulo);
  const [tipo, setTipo] = useState<ContentType>(initial.tipo);
  const [genero, setGenero] = useState(initial.genero ?? "");
  const [ano, setAno] = useState(initial.ano?.toString() ?? "");
  const [imagemUrl, setImagemUrl] = useState(initial.imagemUrl ?? "");
  const [sinopse, setSinopse] = useState(initial.sinopse ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      titulo: titulo.trim(),
      tipo,
      genero: genero.trim() || null,
      ano: ano ? Number(ano) : null,
      imagemUrl: imagemUrl.trim() || null,
      sinopse: sinopse.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cf-titulo">Título</Label>
        <Input id="cf-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cf-tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as ContentType)}>
            <SelectTrigger id="cf-tipo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FILME">Filme</SelectItem>
              <SelectItem value="SERIE">Série</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cf-ano">Ano</Label>
          <Input id="cf-ano" type="number" value={ano} onChange={(e) => setAno(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cf-genero">Gênero</Label>
        <Input id="cf-genero" value={genero} onChange={(e) => setGenero(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cf-imagem">URL da capa</Label>
        <Input id="cf-imagem" type="url" placeholder="https://..." value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cf-sinopse">Sinopse</Label>
        <Textarea id="cf-sinopse" rows={4} maxLength={2000} value={sinopse} onChange={(e) => setSinopse(e.target.value)} />
      </div>
      {tipo === "SERIE" && !initial.titulo && (
        <p className="text-sm text-muted-foreground">
          Depois de salvar, gerencie as temporadas e os episódios na página do título ou na Administração.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
