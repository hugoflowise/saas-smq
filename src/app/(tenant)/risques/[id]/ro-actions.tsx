"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createActionFromRoAction, unlinkRoActionAction } from "@/lib/actions/risques";
import { ACTION_STATUT_LABELS } from "@/lib/labels";

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type LinkedAction = {
  id: string;
  reference: string;
  description_courte: string;
  statut: keyof typeof ACTION_STATUT_LABELS;
};

export function RoActions({ roId, linked }: { roId: string; linked: LinkedAction[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await createActionFromRoAction({
      roId,
      descriptionCourte: f.get("descriptionCourte"),
      priorite: f.get("priorite"),
      datePrevue: f.get("datePrevue") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Action de traitement créée et liée.");
      setCreating(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function unlink(actionId: string) {
    setPending(true);
    const result = await unlinkRoActionAction(roId, actionId);
    setPending(false);
    if (result.ok) {
      toast.success("Action déliée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {linked.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucune action de traitement liée à ce risque / cette opportunité.
        </p>
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
                onClick={() => unlink(a.id)}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-lg border p-3">
          <Input name="descriptionCourte" required placeholder="Action de traitement à mener" />
          <div className="flex flex-wrap gap-2">
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
          className="w-fit gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus className="size-4" />
          Créer une action de traitement
        </Button>
      )}
    </div>
  );
}
