"use client";

import { SupprimerButton } from "@/components/supprimer-button";
import { deleteEnqueteAction } from "@/lib/actions/satisfaction";

export function EnqueteDelete({ id }: { id: string }) {
  return (
    <SupprimerButton
      action={deleteEnqueteAction}
      id={id}
      iconOnly
      libelle="cette réponse"
      successText="Réponse supprimée."
    />
  );
}
