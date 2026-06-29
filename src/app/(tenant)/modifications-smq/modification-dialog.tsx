"use client";

import { Pencil } from "lucide-react";
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
import {
  createModificationSmqAction,
  updateModificationSmqAction,
} from "@/lib/actions/modifications-smq";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type ModificationRow = {
  id: string;
  objet: string;
  finalite: string | null;
  consequences: string | null;
  ressources: string | null;
  responsable_id: string | null;
  date_prevue: string | null;
  date_realisee: string | null;
  statut: string;
  commentaire: string | null;
};

export type MembreOption = { id: string; label: string };

export function ModificationDialog({
  modification,
  membres,
  trigger,
}: {
  modification?: ModificationRow;
  membres: MembreOption[];
  trigger?: React.ReactElement;
}) {
  const isEdit = Boolean(modification);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          objet: f.get("objet"),
          finalite: f.get("finalite") || undefined,
          consequences: f.get("consequences") || undefined,
          ressources: f.get("ressources") || undefined,
          responsableId: f.get("responsableId") || undefined,
          datePrevue: f.get("datePrevue") || undefined,
          dateRealisee: f.get("dateRealisee") || undefined,
          statut: f.get("statut"),
          commentaire: f.get("commentaire") || undefined,
        };
        return isEdit
          ? updateModificationSmqAction({ id: modification?.id, ...data })
          : createModificationSmqAction(data);
      },
      success: isEdit ? "Modification mise à jour." : "Modification planifiée.",
    });
  }

  if (readOnly) return isEdit ? (trigger ?? null) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            (trigger ?? (
              <Button variant="ghost" size="icon" aria-label="Modifier">
                <Pencil className="size-4" />
              </Button>
            ))
          ) : (
            <Button>Nouvelle modification</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la modification du SMQ" : "Nouvelle modification du SMQ"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="objet">Objet de la modification</Label>
            <Input
              id="objet"
              name="objet"
              required
              defaultValue={modification?.objet ?? ""}
              placeholder="Réorganisation d'un processus, nouveau site, changement d'outil…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="finalite">Finalité / raison</Label>
            <Textarea
              id="finalite"
              name="finalite"
              rows={2}
              defaultValue={modification?.finalite ?? ""}
              placeholder="Pourquoi cette modification est-elle nécessaire ?"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="consequences">Conséquences potentielles (intégrité du SMQ)</Label>
            <Textarea
              id="consequences"
              name="consequences"
              rows={2}
              defaultValue={modification?.consequences ?? ""}
              placeholder="Impacts sur les processus, documents, risques, conformité…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ressources">Ressources nécessaires</Label>
            <Textarea
              id="ressources"
              name="ressources"
              rows={2}
              defaultValue={modification?.ressources ?? ""}
              placeholder="Moyens humains, matériels, budgétaires, formation…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="responsableId">Responsable</Label>
              <select
                id="responsableId"
                name="responsableId"
                className={SELECT_CLASS}
                defaultValue={modification?.responsable_id ?? ""}
              >
                <option value="">-</option>
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={modification?.statut ?? "planifiee"}
              >
                <option value="planifiee">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="realisee">Réalisée</option>
                <option value="abandonnee">Abandonnée</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="datePrevue">Date prévue</Label>
              <Input
                id="datePrevue"
                name="datePrevue"
                type="date"
                defaultValue={modification?.date_prevue ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateRealisee">Date de réalisation</Label>
              <Input
                id="dateRealisee"
                name="dateRealisee"
                type="date"
                defaultValue={modification?.date_realisee ?? ""}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={2}
              defaultValue={modification?.commentaire ?? ""}
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Planifier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
