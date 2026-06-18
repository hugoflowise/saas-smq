"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { setCotationAction } from "@/lib/actions/conformite";
import { COTATION_DOT, COTATION_LABELS, type Cotation } from "./cotation-meta";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
  referentielId: string;
  chapitre: string;
  intitule: string;
  preuves: string | null;
  cotation: Cotation;
  commentaire: string;
};

export function ChapterRow({
  referentielId,
  chapitre,
  intitule,
  preuves,
  cotation: initialCotation,
  commentaire: initialCommentaire,
}: Props) {
  const [cotation, setCotation] = useState<Cotation>(initialCotation);
  const [commentaire, setCommentaire] = useState(initialCommentaire);

  async function save(nextCotation: Cotation, nextCommentaire: string) {
    const result = await setCotationAction({
      referentielId,
      cotation: nextCotation,
      commentaire: nextCommentaire || undefined,
    });
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${COTATION_DOT[cotation]}`} />
        <div className="min-w-0">
          <p className="font-medium text-sm">
            <span className="text-muted-foreground">{chapitre}</span> {intitule}
          </p>
          {preuves ? <p className="text-muted-foreground text-xs">Preuves : {preuves}</p> : null}
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
