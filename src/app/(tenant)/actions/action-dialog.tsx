"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createActionAction, updateActionAction } from "@/lib/actions/plan-actions";
import {
  ACTION_ORIGINE_LABELS,
  ACTION_PRIORITE_LABELS,
  ACTION_STATUT_LABELS,
  ACTION_TYPE_LABELS,
} from "@/lib/labels";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ActionRow = {
  id: string;
  description_courte: string;
  description_detail: string | null;
  origine: string;
  type: string;
  priorite: string;
  statut: string;
  processus_concerne: string | null;
  date_prevue: string | null;
  commentaires: string | null;
};

type Props = {
  processusOptions: { id: string; nom: string }[];
  action?: ActionRow;
};

function Options({ map }: { map: Record<string, string> }) {
  return (
    <>
      {Object.entries(map).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  );
}

export function ActionDialog({ processusOptions, action }: Props) {
  const router = useRouter();
  const isEdit = Boolean(action);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      descriptionCourte: form.get("descriptionCourte"),
      descriptionDetail: form.get("descriptionDetail") || undefined,
      origine: form.get("origine"),
      type: form.get("type"),
      priorite: form.get("priorite"),
      statut: form.get("statut"),
      processusConcerne: form.get("processusConcerne") || undefined,
      datePrevue: form.get("datePrevue") || undefined,
      commentaires: form.get("commentaires") || undefined,
    };

    const result = isEdit
      ? await updateActionAction({ id: action?.id, ...payload })
      : await createActionAction(payload);

    setPending(false);

    if (result.ok) {
      toast.success(isEdit ? "Action mise à jour." : "Action créée.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>Nouvelle action</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'action" : "Nouvelle action"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="descriptionCourte">Intitulé</Label>
            <Input
              id="descriptionCourte"
              name="descriptionCourte"
              required
              defaultValue={action?.description_courte ?? ""}
              placeholder="Mettre à jour la revue d'offre"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={action?.statut ?? "a_faire"}
              >
                <Options map={ACTION_STATUT_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="priorite">Priorité</Label>
              <select
                id="priorite"
                name="priorite"
                className={SELECT_CLASS}
                defaultValue={action?.priorite ?? "p2"}
              >
                <Options map={ACTION_PRIORITE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={action?.type ?? "corrective"}
              >
                <Options map={ACTION_TYPE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="origine">Origine</Label>
              <select
                id="origine"
                name="origine"
                className={SELECT_CLASS}
                defaultValue={action?.origine ?? "manuelle"}
              >
                <Options map={ACTION_ORIGINE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusConcerne">Processus</Label>
              <select
                id="processusConcerne"
                name="processusConcerne"
                className={SELECT_CLASS}
                defaultValue={action?.processus_concerne ?? ""}
              >
                <option value="">—</option>
                {processusOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="datePrevue">Échéance</Label>
              <Input
                id="datePrevue"
                name="datePrevue"
                type="date"
                defaultValue={action?.date_prevue ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descriptionDetail">Détail</Label>
            <Textarea
              id="descriptionDetail"
              name="descriptionDetail"
              rows={2}
              defaultValue={action?.description_detail ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaires">Commentaires</Label>
            <Textarea
              id="commentaires"
              name="commentaires"
              rows={2}
              defaultValue={action?.commentaires ?? ""}
            />
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'action"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
