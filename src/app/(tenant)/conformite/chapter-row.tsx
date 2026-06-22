"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { setCotationAction } from "@/lib/actions/conformite";
import { dateProchaineReevaluation } from "@/lib/conformite";
import { formatDate } from "@/lib/format";
import { SELECT_CLASS_COMPACT as SELECT_CLASS } from "@/lib/ui-classes";
import { COTATION_DOT, COTATION_LABELS, type Cotation } from "./cotation-meta";

type Props = {
  referentielId: string;
  chapitre: string;
  intitule: string;
  preuves: string | null;
  cotation: Cotation;
  commentaire: string;
  aReevaluer?: boolean;
  dateEvaluation?: string | null;
};

export function ChapterRow({
  referentielId,
  chapitre,
  intitule,
  preuves,
  cotation: initialCotation,
  commentaire: initialCommentaire,
  aReevaluer = false,
  dateEvaluation = null,
}: Props) {
  const [cotation, setCotation] = useState<Cotation>(initialCotation);
  const [commentaire, setCommentaire] = useState(initialCommentaire);
  // Recoter rafraîchit la date d'évaluation : on masque alors le rappel.
  const [reevalue, setReevalue] = useState(false);
  const afficherReevaluer = aReevaluer && !reevalue;
  const prochaineReeval = dateProchaineReevaluation(dateEvaluation);
  const estValidee = cotation === "conforme" || cotation === "point_fort";
  const afficherDates = Boolean(dateEvaluation) && cotation !== "non_evalue";

  async function save(nextCotation: Cotation, nextCommentaire: string) {
    const result = await setCotationAction({
      referentielId,
      cotation: nextCotation,
      commentaire: nextCommentaire || undefined,
    });
    if (result.ok) setReevalue(true);
    else toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${COTATION_DOT[cotation]}`} />
        <div className="min-w-0">
          <p className="font-medium text-sm">
            <span className="text-muted-foreground">{chapitre}</span> {intitule}
            {afficherReevaluer ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-status-pa/15 px-2 py-0.5 align-middle font-medium text-status-pa text-xs">
                À réévaluer
              </span>
            ) : null}
          </p>
          {preuves ? <p className="text-muted-foreground text-xs">Preuves : {preuves}</p> : null}
          {reevalue ? (
            <p className="text-muted-foreground text-xs">Évalué à l'instant.</p>
          ) : afficherDates ? (
            <p className="text-muted-foreground text-xs">
              Évalué le {formatDate(dateEvaluation)}
              {estValidee && prochaineReeval
                ? ` · à revoir avant le ${formatDate(prochaineReeval)}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:w-[28rem] sm:flex-row">
        <select
          className={SELECT_CLASS}
          value={cotation}
          onChange={(e) => {
            const v = e.target.value as Cotation;
            setCotation(v);
            void save(v, commentaire);
          }}
        >
          {Object.entries(COTATION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <Input
          className="h-8 flex-1"
          placeholder="Commentaire…"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          onBlur={() => save(cotation, commentaire)}
        />
      </div>
    </div>
  );
}
