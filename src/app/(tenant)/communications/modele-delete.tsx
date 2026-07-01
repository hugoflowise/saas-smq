"use client";

import { SupprimerButton } from "@/components/supprimer-button";
import { deleteModeleAction } from "@/lib/actions/communications-modeles";

export function ModeleDelete({ id, titre }: { id: string; titre: string }) {
  return (
    <SupprimerButton
      action={deleteModeleAction}
      id={id}
      libelle={`le modèle « ${titre} »`}
      successText="Modèle supprimé."
    />
  );
}
