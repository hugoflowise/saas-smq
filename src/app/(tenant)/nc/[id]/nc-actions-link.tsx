"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCorrectiveActionForNcAction,
  linkActionToNcAction,
  unlinkActionFromNcAction,
} from "@/lib/actions/nc";
import { ACTION_STATUT_LABELS } from "@/lib/labels";

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type LinkedAction = {
  id: string;
  reference: string;
  description_courte: string;
  statut: keyof typeof ACTION_STATUT_LABELS;
};

export function NcActionsLink({
  ncId,
  linked,
  available,
}: {
  ncId: string;
  linked: LinkedAction[];
  available: { id: string; reference: string; description_courte: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setPending(true);
    const result = await fn();
    setPending(false);
    if (result.ok) {
      toast.success(success);
      router.refresh();
    } else {
      toast.error(result.error ?? "Erreur");
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(
      () =>
        createCorrectiveActionForNcAction({
          ncId,
          descriptionCourte: form.get("descriptionCourte"),
          priorite: form.get("priorite"),
          datePrevue: form.get("datePrevue") || undefined,
        }),
      "Action corrective créée et liée.",
    );
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {linked.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune action corrective liée.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {linked.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-md border bg-surface px-3 py-2 text-sm"
            >
              <span>
                <span className="font-mono text-muted-foreground text-xs">{a.reference}</span>{" "}
                {a.description_courte}
                <span className="ml-2 text-muted-foreground text-xs">
                  ({ACTION_STATUT_LABELS[a.statut]})
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Délier"
                disabled={pending}
                onClick={() => run(() => unlinkActionFromNcAction(ncId, a.id), "Action déliée.")}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Lier une action existante */}
      {available.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={SELECT_CLASS}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Lier une action existante…</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.reference} — {a.description_courte}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            disabled={!selected || pending}
            onClick={() => run(() => linkActionToNcAction(ncId, selected), "Action liée.")}
          >
            Lier
          </Button>
        </div>
      ) : null}

      {/* Créer une action corrective */}
      {creating ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-lg border p-3">
          <Input name="descriptionCourte" required placeholder="Intitulé de l'action corrective" />
          <div className="flex flex-wrap gap-2">
            <select name="priorite" className={SELECT_CLASS} defaultValue="p2">
              <option value="p1">P1 — Haute</option>
              <option value="p2">P2 — Moyenne</option>
              <option value="p3">P3 — Basse</option>
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
          className="w-fit gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus className="size-4" />
          Créer une action corrective
        </Button>
      )}
    </div>
  );
}
