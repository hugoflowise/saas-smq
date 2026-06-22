"use client";

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
import { createReunionAction } from "@/lib/actions/reunions";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function ReunionDialog() {
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) =>
        createReunionAction({
          titre: f.get("titre"),
          type: f.get("type"),
          datePrevue: f.get("datePrevue") || undefined,
          animateur: f.get("animateur") || undefined,
        }),
      success: "Réunion créée. Ouvrez-la pour préparer l'ordre du jour.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouvelle réunion</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle réunion QHSE</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" name="titre" required placeholder="Comité QHSE T1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select id="type" name="type" className={SELECT_CLASS} defaultValue="comite_qhse">
                <option value="comite_qhse">Comité QHSE</option>
                <option value="reunion_echange">Réunion d'échange</option>
                <option value="revue">Revue</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="datePrevue">Date prévue</Label>
              <Input id="datePrevue" name="datePrevue" type="date" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="animateur">Animateur</Label>
            <Input id="animateur" name="animateur" placeholder="Prénom NOM" />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Création…" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
