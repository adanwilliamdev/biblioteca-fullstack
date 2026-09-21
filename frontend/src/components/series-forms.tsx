"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api";
import { useAddEpisode, useAddSeason } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddSeasonForm({ contentId, onDone }: { contentId: number; onDone?: () => void }) {
  const add = useAddSeason();
  const [numero, setNumero] = useState("");
  const [titulo, setTitulo] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    add.mutate(
      { contentId, numero: Number(numero), titulo: titulo.trim() || null },
      {
        onSuccess: () => {
          setNumero("");
          setTitulo("");
          toast.success("Temporada adicionada.");
          onDone?.();
        },
        onError: (err) => toast.error(errorMessage(err, "Não foi possível adicionar a temporada.")),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input type="number" min={0} placeholder="Nº da temporada" aria-label="Número da temporada" value={numero} onChange={(e) => setNumero(e.target.value)} required className="sm:w-44" />
      <Input placeholder="Título (opcional)" aria-label="Título da temporada" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <Button type="submit" disabled={add.isPending}>Adicionar temporada</Button>
    </form>
  );
}

export function AddEpisodeForm({ seasonId, onDone }: { seasonId: number; onDone?: () => void }) {
  const add = useAddEpisode();
  const [numero, setNumero] = useState("");
  const [titulo, setTitulo] = useState("");
  const [duracao, setDuracao] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    add.mutate(
      {
        seasonId,
        numero: Number(numero),
        titulo: titulo.trim() || null,
        duracaoMinutos: duracao ? Number(duracao) : null,
      },
      {
        onSuccess: () => {
          setNumero("");
          setTitulo("");
          setDuracao("");
          toast.success("Episódio adicionado.");
          onDone?.();
        },
        onError: (err) => toast.error(errorMessage(err, "Não foi possível adicionar o episódio.")),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input type="number" min={0} placeholder="Nº do episódio" aria-label="Número do episódio" value={numero} onChange={(e) => setNumero(e.target.value)} required className="sm:w-40" />
      <Input placeholder="Título do episódio" aria-label="Título do episódio" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <Input type="number" min={0} placeholder="Duração (min)" aria-label="Duração em minutos" value={duracao} onChange={(e) => setDuracao(e.target.value)} className="sm:w-36" />
      <Button type="submit" disabled={add.isPending}>Adicionar</Button>
    </form>
  );
}
