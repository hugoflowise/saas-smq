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
import { createRevueAction, updateRevueAction } from "@/lib/actions/audits-revues";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type RevueRow = {
  id: string;
  annee: number;
  date_realisation: string | null;
  statut: string;
  ordre_du_jour: string | null;
  conclusions: string | null;
  decisions: string | null;
};

export function RevueDialog({
  revue,
  trigger,
}: {
  revue?: RevueRow;
  trigger?: React.ReactElement;
}) {
  const isEdit = Boolean(revue);
  const { open, setOpen, pending, submit } = useDialogForm();
  const currentYear = new Date().getFullYear();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          annee: f.get("annee"),
          dateRealisation: f.get("dateRealisation") || undefined,
          statut: f.get("statut"),
          ordreDuJour: f.get("ordreDuJour") || undefined,
          conclusions: f.get("conclusions") || undefined,
          decisions: f.get("decisions") || undefined,
        };
        return isEdit ? updateRevueAction({ id: revue?.id, ...data }) : createRevueAction(data);
      },
      success: isEdit ? "Revue mise à jour." : "Revue de direction créée.",
    });
  }

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
            <Button>Nouvelle revue</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la revue" : "Nouvelle revue de direction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                name="annee"
                type="number"
                required
                defaultValue={revue?.annee ?? currentYear}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateRealisation">Date</Label>
              <Input
                id="dateRealisation"
                name="dateRealisation"
                type="date"
                defaultValue={revue?.date_realisation ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={revue?.statut ?? "planifiee"}
              >
                <option value="planifiee">Planifiée</option>
                <option value="realisee">Réalisée</option>
                <option value="cloturee">Clôturée</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ordreDuJour">Ordre du jour</Label>
            <Textarea
              id="ordreDuJour"
              name="ordreDuJour"
              rows={3}
              defaultValue={revue?.ordre_du_jour ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="conclusions">Conclusions</Label>
            <Textarea
              id="conclusions"
              name="conclusions"
              rows={3}
              defaultValue={revue?.conclusions ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="decisions">Décisions</Label>
            <Textarea
              id="decisions"
              name="decisions"
              rows={3}
              defaultValue={revue?.decisions ?? ""}
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
