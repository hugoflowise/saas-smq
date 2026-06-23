"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { validerElementAction, validerToutAction } from "@/lib/actions/validation";

type TableProposee = "processus" | "actions" | "parties_interessees";

/** Bouton « Valider » pour un élément prérempli (le rend pris en compte). */
export function ValiderButton({ table, id }: { table: TableProposee; id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function valider(e: React.MouseEvent) {
    // Utile si le bouton est posé à l'intérieur d'un lien (cartes processus).
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    const r = await validerElementAction({ table, id });
    setPending(false);
    if (r.ok) {
      toast.success("Élément validé.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 shrink-0 gap-1.5 px-2.5 text-xs"
      disabled={pending}
      onClick={valider}
    >
      <Check className="size-3.5" />
      Valider
    </Button>
  );
}

/**
 * Bannière d'en-tête de module : explique que des éléments sont préremplis et
 * propose un « Tout valider ». Ne s'affiche pas s'il n'y a rien à valider.
 */
export function ProposeBanner({
  table,
  count,
  libelle,
}: {
  table: TableProposee;
  /** Nombre d'éléments proposés non encore validés. */
  count: number;
  /** Nom de la collection au pluriel (ex. « parties prenantes », « processus »). */
  libelle: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  if (count <= 0) return null;

  async function validerTout() {
    setPending(true);
    const r = await validerToutAction({ table });
    setPending(false);
    if (r.ok) {
      toast.success("Tous les éléments proposés ont été validés.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-status-pa/40 bg-status-pa/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-status-pa">
        Flowise a prérempli <strong>{count}</strong> {libelle} pour vous faire gagner du temps.
        Passez chaque élément en revue, puis validez-le, modifiez-le ou supprimez-le. Tant qu'un
        élément n'est pas validé, il n'est pas comptabilisé.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5"
        disabled={pending}
        onClick={validerTout}
      >
        <Check className="size-3.5" />
        Tout valider
      </Button>
    </div>
  );
}
