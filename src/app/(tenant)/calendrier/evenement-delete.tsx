"use client";

import { SupprimerButton } from "@/components/supprimer-button";
import { deleteEvenementAction } from "@/lib/actions/evenements";

export function EvenementDelete({ id }: { id: string }) {
  return (
    <SupprimerButton
      action={deleteEvenementAction}
      id={id}
      iconOnly
      libelle="cet événement"
      successText="Événement supprimé."
    />
  );
}
