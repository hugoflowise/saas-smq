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
import { updateProcessusAction } from "@/lib/actions/processus";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type ProcessusForEdit = {
  id: string;
  nom: string;
  type: "pilotage" | "realisation" | "support";
  description: string | null;
  entrees: string | null;
  sorties: string | null;
  date_derniere_revue: string | null;
  date_prochaine_revue: string | null;
};

export function EditProcessusDialog({ processus }: { processus: ProcessusForEdit }) {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) =>
        updateProcessusAction({
          id: processus.id,
          nom: form.get("nom"),
          type: form.get("type"),
          description: form.get("description") || undefined,
          entrees: form.get("entrees") || undefined,
          sorties: form.get("sorties") || undefined,
          dateDerniereRevue: form.get("dateDerniereRevue") || undefined,
          dateProchaineRevue: form.get("dateProchaineRevue") || undefined,
        }),
      success: "Processus mis à jour.",
    });
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="size-4" />
            Modifier
          </Button>
        }
      />
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Modifier le processus</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" required defaultValue={processus.nom} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" className={SELECT_CLASS} defaultValue={processus.type}>
              <option value="pilotage">Pilotage</option>
              <option value="realisation">Réalisation</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={processus.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="entrees">Entrées</Label>
              <Textarea
                id="entrees"
                name="entrees"
                rows={2}
                defaultValue={processus.entrees ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sorties">Sorties</Label>
              <Textarea
                id="sorties"
                name="sorties"
                rows={2}
                defaultValue={processus.sorties ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateDerniereRevue">Dernière revue</Label>
              <Input
                id="dateDerniereRevue"
                name="dateDerniereRevue"
                type="date"
                defaultValue={processus.date_derniere_revue ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateProchaineRevue">Prochaine revue</Label>
              <Input
                id="dateProchaineRevue"
                name="dateProchaineRevue"
                type="date"
                defaultValue={processus.date_prochaine_revue ?? ""}
              />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
