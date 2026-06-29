"use client";

import { BadgeCheck, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createActionForObjectifAction } from "@/lib/actions/plan-actions";
import { validerObjectifAction } from "@/lib/actions/registres";
import { formatDate } from "@/lib/format";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { ACTION_STATUT_LABELS } from "@/lib/labels";
import { SELECT_CLASS_INLINE as SELECT_CLASS } from "@/lib/ui-classes";

type LinkedAction = {
  id: string;
  reference: string;
  description_courte: string;
  statut: string;
};

/**
 * §6.2.2 : actions planifiées pour atteindre un objectif + établissement
 * par la direction. Affiché sous chaque objectif de la liste.
 */
export function ObjectifActions({
  objectifId,
  linked,
  valideLe,
  valideurNom,
  canApprove,
}: {
  objectifId: string;
  linked: LinkedAction[];
  valideLe: string | null;
  valideurNom: string | null;
  canApprove: boolean;
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await createActionForObjectifAction({
      objectifId,
      descriptionCourte: f.get("descriptionCourte"),
      priorite: f.get("priorite"),
      datePrevue: f.get("datePrevue") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Action créée et liée à l'objectif.");
      setCreating(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function toggleValidation(valider: boolean) {
    setPending(true);
    const result = await validerObjectifAction({ id: objectifId, valider });
    setPending(false);
    if (result.ok) {
      toast.success(valider ? "Objectif établi par la direction." : "Établissement retiré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Établissement par la direction (§6.2) */}
      <div className="flex flex-wrap items-center gap-2">
        {valideLe ? (
          <span className="flex items-center gap-1.5 text-status-conforme text-xs">
            <BadgeCheck className="size-3.5" />
            Établi par la direction {valideurNom ? `(${valideurNom}) ` : ""}le{" "}
            {formatDate(valideLe)}
            {canApprove && !readOnly ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                disabled={pending}
                onClick={() => toggleValidation(false)}
              >
                Retirer
              </Button>
            ) : null}
          </span>
        ) : canApprove && !readOnly ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={pending}
            onClick={() => toggleValidation(true)}
          >
            <BadgeCheck className="size-3.5" />
            Établir (direction)
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">Non encore établi par la direction.</span>
        )}
      </div>

      {/* Actions liées */}
      {linked.length === 0 ? (
        <p className="text-muted-foreground text-xs">Aucune action planifiée pour cet objectif.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {linked.map((a) => (
            <li key={a.id} className="text-sm">
              <Link href={`/actions/${a.id}`} className="hover:text-primary hover:underline">
                <span className="font-mono text-muted-foreground text-xs">{a.reference}</span>{" "}
                {a.description_courte}
              </Link>
              <span className="ml-2 text-muted-foreground text-xs">
                ({ACTION_STATUT_LABELS[a.statut as keyof typeof ACTION_STATUT_LABELS] ?? a.statut})
              </span>
            </li>
          ))}
        </ul>
      )}

      {!readOnly &&
        (creating ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-lg border p-3">
            <Input
              name="descriptionCourte"
              required
              placeholder="Action à mener pour atteindre l'objectif"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select name="priorite" className={SELECT_CLASS} defaultValue="p2">
                <option value="p1">P1 · Haute</option>
                <option value="p2">P2 · Moyenne</option>
                <option value="p3">P3 · Basse</option>
              </select>
              <Input name="datePrevue" type="date" className="w-auto" />
              <Button type="submit" size="sm" disabled={pending}>
                Créer et lier
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-fit gap-1.5 text-xs"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-3.5" />
            Créer une action liée
          </Button>
        ))}
    </div>
  );
}
