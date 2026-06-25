"use client";

import { Plus } from "lucide-react";
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
import { createActionAction } from "@/lib/actions/plan-actions";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

/** Crée une action de plan d'actions rattachée à la revue (origine « rdd », §9.3.3). */
export function RevueActionForm({ revueId }: { revueId: string }) {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  if (readOnly) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) =>
        createActionAction({
          descriptionCourte: f.get("descriptionCourte"),
          descriptionDetail: f.get("descriptionDetail") || undefined,
          origine: "rdd",
          type: "preventive",
          priorite: f.get("priorite"),
          statut: "a_faire",
          datePrevue: f.get("datePrevue") || undefined,
          revueId,
        }),
      success: "Action créée et rattachée à la revue.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus className="size-3.5" />
            Ajouter une action
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Action décidée en revue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="descriptionCourte">Action</Label>
            <Input id="descriptionCourte" name="descriptionCourte" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descriptionDetail">Détail (facultatif)</Label>
            <Textarea id="descriptionDetail" name="descriptionDetail" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="priorite">Priorité</Label>
              <select id="priorite" name="priorite" className={SELECT_CLASS} defaultValue="p2">
                <option value="p1">P1 — haute</option>
                <option value="p2">P2 — moyenne</option>
                <option value="p3">P3 — basse</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="datePrevue">Échéance</Label>
              <Input id="datePrevue" name="datePrevue" type="date" />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Création…" : "Créer l'action"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
