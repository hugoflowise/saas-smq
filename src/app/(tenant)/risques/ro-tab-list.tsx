"use client";

import Link from "next/link";
import { SupprimerButton } from "@/components/supprimer-button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteRoAction } from "@/lib/actions/risques";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { RoDialog, type RoRow } from "./ro-dialog";

type Row = RoRow & { criticite: number | null };

/**
 * Liste des risques/opportunités d'un processus, directement actionnable :
 * un clic sur l'intitulé ouvre l'édition (dialogue), et chaque ligne dispose
 * d'un bouton de suppression (corbeille). Plus besoin de passer par la liste
 * globale puis de rechercher l'élément.
 */
export function RoTabList({
  rows,
  processusOptions,
}: {
  rows: Row[];
  processusOptions: { id: string; nom: string }[];
}) {
  const readOnly = useReadOnly();

  return (
    <Card>
      <CardContent className="py-2">
        <ul className="flex flex-col divide-y">
          {rows.map((r) => {
            const secondaire = `${r.type === "risque" ? "Risque" : "Opportunité"} · criticité ${r.criticite ?? "-"}`;
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                {readOnly ? (
                  <Link
                    href={`/risques/${r.id}`}
                    className="min-w-0 truncate font-medium text-sm hover:text-primary"
                  >
                    {r.intitule}
                  </Link>
                ) : (
                  <RoDialog
                    ro={r}
                    processusOptions={processusOptions}
                    trigger={
                      <button
                        type="button"
                        className="min-w-0 cursor-pointer truncate text-left font-medium text-sm hover:text-primary"
                      >
                        {r.intitule}
                      </button>
                    }
                  />
                )}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground text-xs">{secondaire}</span>
                  <SupprimerButton
                    action={deleteRoAction}
                    id={r.id}
                    libelle={r.type === "risque" ? "ce risque" : "cette opportunité"}
                    iconOnly
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
