import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogView } from "@/components/catalog-view";

export const metadata: Metadata = { title: "Catálogo" };

export default function Page() {
  // useSearchParams (filtros na URL) exige um limite de Suspense.
  return (
    <Suspense>
      <CatalogView />
    </Suspense>
  );
}
