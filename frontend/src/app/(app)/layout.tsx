import { Navbar } from "@/components/navbar";
import { AuthGate } from "@/components/auth-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
        <AuthGate>{children}</AuthGate>
      </main>
    </>
  );
}
