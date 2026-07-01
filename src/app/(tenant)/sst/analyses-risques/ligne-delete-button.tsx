"use client";

import { SupprimerButton } from "@/components/supprimer-button";
import { deleteLigneAction } from "@/lib/actions/analyses-risques";

/** Suppression d'une ligne d'analyse (suppression définitive, pas de corbeille). */
export function LigneDeleteButton({ id, analyseId }: { id: string; analyseId: string }) {
  return (
    <SupprimerButton
      action={() => deleteLigneAction({ id, analyseId })}
      id={id}
      libelle="cette situation de travail"
      confirmText="Supprimer cette situation de travail ?"
      successText="Situation supprimée."
      iconOnly
    />
  );
}
