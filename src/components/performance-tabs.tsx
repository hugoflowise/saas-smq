"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/strategie/objectifs", label: "Objectifs" },
  { href: "/indicateurs", label: "Indicateurs" },
];

/** Onglets du module « Objectifs & indicateurs » (navigation entre les deux vues). */
export function PerformanceTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-1 border-b">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
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
