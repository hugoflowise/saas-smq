"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setMaseScoreAction } from "@/lib/actions/conformite";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { COTATION_TYPE_LABELS, type CotationType } from "@/lib/mase-score";
import { cn } from "@/lib/utils";

type Props = {
  referentielId: string;
  chapitre: string;
  intitule: string;
  pointsMax: number;
  cotationType: CotationType;
  neutralisable: boolean;
  pointsObtenus: number | null;
  neutralisee: boolean;
};

export function MaseQuestionRow({
  referentielId,
  chapitre,
  intitule,
  pointsMax,
  cotationType,
  neutralisable,
  pointsObtenus: initialPoints,
  neutralisee: initialNeutralisee,
}: Props) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [points, setPoints] = useState<number | null>(initialPoints);
  const [neutralisee, setNeutralisee] = useState(initialNeutralisee);
  const [pending, setPending] = useState(false);

  // Plafond : le double du max pour une question VD (cotée jusqu'au double en
  // renouvellement), le max sinon.
  const plafond = cotationType === "VD" ? pointsMax * 2 : pointsMax;

  async function enregistrer(nextPoints: number | null, nextNeutralisee: boolean) {
    if (readOnly) {
      toast.error("Lecture seule : votre rôle ne permet pas de modifier les données.");
      return;
    }
    setPoints(nextNeutralisee ? null : nextPoints);
    setNeutralisee(nextNeutralisee);
    setPending(true);
    const result = await setMaseScoreAction({
      referentielId,
      pointsObtenus: nextNeutralisee ? null : nextPoints,
      neutralisee: nextNeutralisee,
    });
    setPending(false);
    if (result.ok) router.refresh();
    else toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-2 border-b px-4 py-3 last:border-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 font-mono font-medium text-muted-foreground text-xs">
            {chapitre}
          </span>
          <p className={cn("text-sm", neutralisee && "text-muted-foreground line-through")}>
            {intitule}
          </p>
        </div>
        <p className="mt-0.5 pl-8 text-muted-foreground text-xs">
          {pointsMax} pts · {COTATION_TYPE_LABELS[cotationType]}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
        {neutralisee ? (
          <span className="text-muted-foreground text-xs italic">Neutralisée</span>
        ) : cotationType === "B" ? (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={points === 0 ? "default" : "outline"}
              disabled={pending}
              onClick={() => enregistrer(0, false)}
            >
              Non
            </Button>
            <Button
              type="button"
              size="sm"
              variant={points === pointsMax ? "default" : "outline"}
              disabled={pending}
              onClick={() => enregistrer(pointsMax, false)}
            >
              Oui
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={plafond}
              value={points ?? ""}
              disabled={pending}
              onChange={(e) => setPoints(e.target.value === "" ? null : Number(e.target.value))}
              onBlur={() => enregistrer(points, false)}
              className="h-8 w-20 text-right"
            />
            <span className="text-muted-foreground text-xs">/ {plafond}</span>
          </div>
        )}

        {neutralisable ? (
          <label className="flex items-center gap-1 text-muted-foreground text-xs">
            <input
              type="checkbox"
              className="size-3.5"
              checked={neutralisee}
              disabled={pending}
              onChange={(e) => enregistrer(points, e.target.checked)}
            />
            Neutraliser
          </label>
        ) : null}
      </div>
    </div>
  );
}
