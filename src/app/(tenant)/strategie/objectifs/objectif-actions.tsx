"use client";

import { Link2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createActionForObjectifAction,
  lierActionObjectifAction,
} from "@/lib/actions/plan-actions";
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
 * §6.2.2 : actions planifiées pour atteindre un objectif. Affiché sous chaque
 * objectif de la liste : liste des actions liées, création d'une nouvelle action
 * liée, et rattachement d'une action existante.
 */
export function ObjectifActions({
  objectifId,
  linked,
  actionsDisponibles,
}: {
  objectifId: string;
  linked: LinkedAction[];
  /** Actions existantes non encore rattachées, proposées au lien. */
  actionsDisponibles: { id: string; reference: string; description_courte: string }[];
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [linking, setLinking] = useState(false);

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

  async function handleLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const actionId = f.get("actionId");
    if (typeof actionId !== "string" || !actionId) {
      toast.error("Choisissez une action à lier.");
      return;
    }
    setPending(true);
    const result = await lierActionObjectifAction({ actionId, objectifId });
    setPending(false);
    if (result.ok) {
      toast.success("Action liée à l'objectif.");
      setLinking(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleUnlink(actionId: string) {
    setPending(true);
    const result = await lierActionObjectifAction({ actionId, objectifId: null });
    setPending(false);
    if (result.ok) {
      toast.success("Action déliée de l'objectif.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Actions liées */}
      {linked.length === 0 ? (
        <p className="text-muted-foreground text-xs">Aucune action planifiée pour cet objectif.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {linked.map((a) => (
            <li key={a.id} className="flex items-center gap-1.5 text-sm">
              <Link href={`/actions/${a.id}`} className="hover:text-primary hover:underline">
                <span className="font-mono text-muted-foreground text-xs">{a.reference}</span>{" "}
                {a.description_courte}
              </Link>
              <span className="text-muted-foreground text-xs">
                ({ACTION_STATUT_LABELS[a.statut as keyof typeof ACTION_STATUT_LABELS] ?? a.statut})
              </span>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Délier cette action"
                  title="Délier cette action de l'objectif"
                  disabled={pending}
                  onClick={() => handleUnlink(a.id)}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {!readOnly ? (
        <div className="flex flex-col gap-2">
          {/* Créer une action liée */}
          {creating ? (
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
          ) : linking ? (
            <form onSubmit={handleLink} className="flex flex-col gap-2 rounded-lg border p-3">
              {actionsDisponibles.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Aucune action disponible à lier (toutes sont déjà rattachées à un objectif).
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <select name="actionId" className={SELECT_CLASS} defaultValue="">
                    <option value="" disabled>
                      Choisir une action existante…
                    </option>
                    {actionsDisponibles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.reference} · {a.description_courte}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" disabled={pending}>
                    Lier
                  </Button>
                </div>
              )}
              <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setLinking(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-1.5 text-xs"
                onClick={() => setCreating(true)}
              >
                <Plus className="size-3.5" />
                Créer une action liée
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-1.5 text-xs"
                onClick={() => setLinking(true)}
              >
                <Link2 className="size-3.5" />
                Lier une action existante
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
