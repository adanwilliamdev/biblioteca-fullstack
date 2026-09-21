import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
