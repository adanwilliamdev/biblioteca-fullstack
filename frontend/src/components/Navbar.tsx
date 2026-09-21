"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Clapperboard, LayoutDashboard, LogOut, Menu, ShieldCheck, User as UserIcon } from "lucide-react";

import { useLogout, useMe } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/catalogo", label: "Catálogo", icon: Clapperboard },
  { href: "/admin", label: "Administração", icon: ShieldCheck, adminOnly: true },
  { href: "/perfil", label: "Perfil", icon: UserIcon },
];

export function Navbar() {
  const { data: user } = useMe();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const links = LINKS.filter((l) => !l.adminOnly || user.role === "ADMIN");
  const isActive = (l: (typeof LINKS)[number]) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href);

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active ? "bg-primary/15 text-ring" : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Clapperboard className="size-5 text-primary" /> Minha Biblioteca
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(isActive(l))} aria-current={isActive(l) ? "page" : undefined}>
              <l.icon className="size-4" /> {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user.nome[0]?.toUpperCase()}
            </span>
            {user.nome}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" aria-label="Sair">
            <LogOut />
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navegação principal</SheetDescription>
            <nav className="flex flex-col gap-1" aria-label="Principal (mobile)">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(isActive(l))}>
                  <l.icon className="size-4" /> {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex items-center justify-between border-t pt-4">
              <span className="truncate text-sm text-muted-foreground">{user.nome}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut /> Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
