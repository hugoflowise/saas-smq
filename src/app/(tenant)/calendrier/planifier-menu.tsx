"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Raccourcis de planification : mènent vers le module concerné, où l'objet
 * (audit, réunion…) se crée avec son workflow complet. Une fois daté, il
 * apparaît automatiquement dans le calendrier. Évite les doublons « fantômes ».
 */
const RACCOURCIS = [
  { label: "Planifier un audit", href: "/audits" },
  { label: "Planifier une réunion QHSE", href: "/reunions" },
  { label: "Planifier une revue de direction", href: "/revues/direction" },
  { label: "Créer une action", href: "/actions" },
];

export function PlanifierMenu() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="gap-2">
            <CalendarPlus className="size-4" />
            Planifier
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        {RACCOURCIS.map((r) => (
          <DropdownMenuItem key={r.href} onClick={() => router.push(r.href)}>
            {r.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
