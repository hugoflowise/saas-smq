"use client";

import { SupprimerButton } from "@/components/supprimer-button";
import { deleteAttenteAction } from "@/lib/actions/parties-prenantes";

export function AttenteDelete({ id, partieId }: { id: string; partieId: string }) {
  return (
    <SupprimerButton
      action={(attenteId) => deleteAttenteAction(attenteId, partieId)}
      id={id}
      iconOnly
      libelle="cette attente"
      successText="Attente supprimée."
    />
  );
}
