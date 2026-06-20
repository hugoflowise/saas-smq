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
import { Textarea } from "@/components/ui/textarea";
import { createEvenementAction } from "@/lib/actions/evenements";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

export function EvenementDialog() {
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) =>
        createEvenementAction({
          titre: f.get("titre"),
          dateEvenement: f.get("dateEvenement"),
          description: f.get("description") || undefined,
        }),
      success: "Événement ajouté.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Événement</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel événement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              name="titre"
              required
              placeholder="CODIR qualité, réunion d'équipe…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dateEvenement">Date</Label>
            <Input id="dateEvenement" name="dateEvenement" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
