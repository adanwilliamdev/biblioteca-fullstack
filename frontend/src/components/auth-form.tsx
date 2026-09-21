"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Clapperboard } from "lucide-react";

import { errorMessage } from "@/lib/api";
import { useLogin, useMe, useRegister } from "@/lib/queries";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Só aceita caminhos internos (evita open redirect via ?next=). */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { data: user } = useMe();
  const login = useLogin();
  const register = useRegister();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";
  const pending = login.isPending || register.isPending;

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const fallback = isLogin ? "E-mail ou senha inválidos" : "Não foi possível criar sua conta";
    const onError = (err: unknown) => setError(errorMessage(err, fallback));
    if (isLogin) login.mutate({ email, senha }, { onError });
    else register.mutate({ nome, email, senha }, { onError });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Clapperboard className="size-8 text-primary" />
        <CardTitle className="text-2xl">{isLogin ? "Entrar" : "Criar conta"}</CardTitle>
        <CardDescription>
          {isLogin ? "Acesse sua biblioteca de séries e filmes" : "Comece a organizar seus filmes e séries"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          {!isLogin && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus autoComplete="name" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus={isLogin} autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={isLogin ? undefined : 6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? (isLogin ? "Entrando..." : "Criando...") : isLogin ? "Entrar" : "Criar conta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta? " : "Já tem conta? "}
            <Link href={isLogin ? "/register" : "/login"} className="text-primary hover:underline">
              {isLogin ? "Cadastre-se" : "Entrar"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
