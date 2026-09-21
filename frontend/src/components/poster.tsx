import { cn } from "@/lib/utils";

/** Capa do título; sem imagem, mostra o nome sobre um fundo neutro. */
export function Poster({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs de capa são livres (TMDB ou manuais)
        <img src={src} alt={`Capa de ${title}`} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center p-3 text-center text-sm font-medium text-muted-foreground">
          {title}
        </div>
      )}
    </div>
  );
}
