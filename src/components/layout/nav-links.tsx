"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isModuleVisible } from "@/lib/modules";
import { ADMIN_NAV_SECTION, NAV_ITEMS_GESTION_UTILISATEURS, NAV_SECTIONS } from "@/lib/navigation";
import { navLabel } from "@/lib/normes-libelles";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Liste des sections/items de navigation. Partagée sidebar desktop + menu mobile. */
export function NavLinks({
  isAdmin = false,
  canManageUsers = false,
  showOnboarding = true,
  normesActives = ["9001"],
  onNavigate,
}: {
  isAdmin?: boolean;
  canManageUsers?: boolean;
  /** Affiche l'entrée « Mise en route » (masquée une fois la mise en route terminée). */
  showOnboarding?: boolean;
  /** Référentiels actifs du client : pilote l'affichage des modules métier. */
  normesActives?: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const baseSections = isAdmin ? [...NAV_SECTIONS, ADMIN_NAV_SECTION] : NAV_SECTIONS;
  // Masque selon les droits (gestion utilisateurs) et l'avancement (mise en route).
  const masques = [
    ...(canManageUsers ? [] : NAV_ITEMS_GESTION_UTILISATEURS),
    ...(showOnboarding ? [] : ["/mise-en-route"]),
  ];
  const sections = baseSections
    .map((s) => ({
      ...s,
      items: s.items.filter(
        (i) => !masques.includes(i.href) && isModuleVisible(i.href, normesActives),
      ),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <nav className="px-3 py-4">
      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="px-2 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">
                      {navLabel(item.href, item.label, normesActives)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
