"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api";
import { useMe, useUpdateProfile } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm() {
  const { data: user } = useMe();
  const update = useUpdateProfile();
  const [nome, setNome] = useState(user?.nome ?? "");

  if (!user) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    update.mutate(nome, {
      onSuccess: () => toast.success("Perfil atualizado."),
      onError: (err) => toast.error(errorMessage(err, "Não foi possível atualizar o perfil.")),
    });
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {user.nome[0]?.toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-col">
              <strong className="truncate">{user.nome}</strong>
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {user.role === "ADMIN" ? "Administrador" : "Usuário"}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={user.email} disabled />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
