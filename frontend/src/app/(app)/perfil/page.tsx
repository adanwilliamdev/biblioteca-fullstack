import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "Perfil" };

export default function Page() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-semibold">Meu perfil</h1>
      <ProfileForm />
    </div>
  );
}
