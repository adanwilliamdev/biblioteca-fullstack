import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
