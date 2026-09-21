import type { Metadata } from "next";

import { AuthGate } from "@/components/auth-gate";
import { AdminView } from "@/components/admin-view";

export const metadata: Metadata = { title: "Administração" };

export default function Page() {
  return (
    <AuthGate adminOnly>
      <AdminView />
    </AuthGate>
  );
}
