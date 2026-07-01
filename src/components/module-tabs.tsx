"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ModuleTab = { href: string; label: string };

/** Barre d'onglets d'un module regroupé (navigation par route entre les vues). */
export function ModuleTabs({ tabs }: { tabs: ModuleTab[] }) {
  const pathname = usePathname();
  // Un seul onglet actif : le plus spécifique dont le href correspond au chemin
  // (gère les onglets imbriqués, ex. « /x » parent de « /x/analyse »).
  const activeHref = tabs
    .filter((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))
    .reduce<string | null>(
      (best, t) => (best && best.length >= t.href.length ? best : t.href),
      null,
    );
  return (
    <div className="mb-6 flex gap-1 border-b">
      {tabs.map((t) => {
        const active = t.href === activeHref;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 font-medium text-sm transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
