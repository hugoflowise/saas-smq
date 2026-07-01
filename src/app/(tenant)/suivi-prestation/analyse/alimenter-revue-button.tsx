"use client";

import { ClipboardList, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alimenterRevueEcouteClientAction } from "@/lib/actions/audits-revues";

/**
 * Reporte la synthèse d'écoute client dans l'élément d'entrée « Synthèse de la
 * performance » de la revue de direction à venir (§9.3.2 c), puis y redirige.
 */
export function AlimenterRevueButton({ annee }: { annee: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function alimenter() {
    if (pending) return;
    setPending(true);
    const r = await alimenterRevueEcouteClientAction({ annee });
    setPending(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Synthèse ajoutée à la revue de direction.");
    router.push(`/revues/direction/${r.id}`);
  }

  return (
    <Button variant="outline" size="sm" onClick={alimenter} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardList className="size-4" />}
      Alimenter la revue de direction
    </Button>
  );
}
