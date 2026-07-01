"use client";

import { SupprimerButton } from "@/components/supprimer-button";
import { deleteConsultantAction } from "@/lib/actions/consultants";

export function ConsultantDelete({ id }: { id: string }) {
  return (
    <SupprimerButton
      action={deleteConsultantAction}
      id={id}
      iconOnly
      libelle="ce consultant"
      confirmText="Retirer ce consultant du référentiel ? Il sera mis à la corbeille."
      successText="Consultant retiré."
    />
  );
}
