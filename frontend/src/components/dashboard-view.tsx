"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Clapperboard, Clock, Film, ListChecks, Tv, type LucideIcon } from "lucide-react";

import { useDashboard } from "@/lib/queries";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Poster } from "@/components/poster";

const GENRE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
const STATUS_COLORS = ["var(--success)", "var(--chart-1)", "var(--border)"];

function Stat({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string | number; label: string; tone: string }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl leading-tight font-semibold">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const { data, isPending, isError } = useDashboard();

  if (isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (isError) return <Alert variant="destructive">Não foi possível carregar o dashboard.</Alert>;

  const statusData = [
    { name: "Concluídas", value: data.seriesConcluidas },
    { name: "Em progresso", value: data.seriesEmProgresso },
    { name: "Não iniciadas", value: data.seriesNaoIniciadas },
  ].filter((i) => i.value > 0);
  const maxGenero = Math.max(1, ...data.distribuicaoPorGenero.map((g) => g.quantidade));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Film} value={data.totalFilmes} label="Filmes no catálogo" tone="bg-chart-6/15 text-chart-6" />
        <Stat icon={Tv} value={data.totalSeries} label="Séries no catálogo" tone="bg-chart-1/15 text-chart-1" />
        <Stat icon={ListChecks} value={data.episodiosAssistidos} label="Episódios assistidos" tone="bg-chart-2/15 text-chart-2" />
        <Stat icon={Clock} value={`${data.totalHorasAssistidas.toFixed(1)}h`} label="Horas assistidas" tone="bg-chart-5/15 text-chart-5" />
      </div>

      <Card className="py-4">
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progresso geral</span>
            <span>{data.progressoGeral.toFixed(0)}%</span>
          </div>
          <Progress value={data.progressoGeral} className="h-2.5" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Séries por situação</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} cornerRadius={8} paddingAngle={statusData.length > 1 ? 3 : 0} stroke="none">
                        {statusData.map((item, i) => (
                          <Cell key={item.name} fill={STATUS_COLORS[["Concluídas", "Em progresso", "Não iniciadas"].indexOf(item.name)] ?? STATUS_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }}
                        itemStyle={{ color: "var(--popover-foreground)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {statusData.map((item) => (
                    <li key={item.name} className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: STATUS_COLORS[["Concluídas", "Em progresso", "Não iniciadas"].indexOf(item.name)] }} />
                      {item.name} ({item.value})
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Adicione séries ao catálogo para ver este gráfico.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por gênero</CardTitle>
          </CardHeader>
          <CardContent>
            {data.distribuicaoPorGenero.length > 0 ? (
              <ul className="space-y-3">
                {data.distribuicaoPorGenero.map((g, i) => (
                  <li key={g.genero} className="grid grid-cols-[minmax(0,7rem)_1fr_2rem] items-center gap-3 text-sm">
                    <span className="truncate text-muted-foreground" title={g.genero}>{g.genero}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full" style={{ width: `${(g.quantidade / maxGenero) * 100}%`, background: GENRE_COLORS[i % GENRE_COLORS.length] }} />
                    </div>
                    <span className="text-right font-medium">{g.quantidade}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum gênero cadastrado ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Continuar assistindo</h2>
        {data.continuarAssistindo.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-sm text-muted-foreground">
            <Clapperboard className="size-6 opacity-60" />
            Você ainda não começou a assistir nada. Explore o catálogo!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.continuarAssistindo.map((item) => (
              <Link key={item.episodioId} href={`/catalogo/${item.conteudoId}`} className="flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent">
                <Poster src={item.imagemUrl} title={item.tituloConteudo} className="h-20 w-14 shrink-0 rounded-md text-[10px]" />
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <strong className="truncate">{item.tituloConteudo}</strong>
                  <span className="text-xs text-muted-foreground">Temporada {item.numeroTemporada}, episódio {item.numeroEpisodio}</span>
                  <Progress value={item.progressoSerie} className="mt-1 h-1.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
