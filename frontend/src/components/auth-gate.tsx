"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useMe } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

/** Garante sessão válida nas páginas internas e expõe o usuário via useMe(). */
export function AuthGate({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { data: user, isPending } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      const next = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
      router.replace(`/login${next}`);
    } else if (adminOnly && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, isPending, adminOnly, pathname, router]);

  if (isPending || !user || (adminOnly && user.role !== "ADMIN")) {
    return (
      <div className="space-y-4 py-8" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return <>{children}</>;
}
