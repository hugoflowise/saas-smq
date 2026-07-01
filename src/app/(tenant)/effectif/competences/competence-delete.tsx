"use client";

import { SupprimerButton } from "@/components/supprimer-button";
import { deleteCompetenceAction } from "@/lib/actions/competences";

/** Suppression (corbeille) d'une compétence du référentiel. */
export function CompetenceDelete({ id }: { id: string }) {
  return (
    <SupprimerButton
      action={deleteCompetenceAction}
      id={id}
      iconOnly
      libelle="cette compétence du référentiel"
      successText="Compétence supprimée."
    />
  );
}
