"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { setUnauthorizedHandler } from "@/lib/api";
import { qk } from "@/lib/queries";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  useEffect(() => {
    // Sessão não renovável -> o AuthGate vê "sem usuário" e leva para /login.
    setUnauthorizedHandler(() => queryClient.setQueryData(qk.me, null));
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
