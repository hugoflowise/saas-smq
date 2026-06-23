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
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

export function EvenementDialog() {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

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

  // Création uniquement : masquée pour l'auditeur (lecture seule).
  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Autre événement</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Autre événement</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Pour un événement ponctuel sans module dédié (CODIR, fermeture annuelle, salon…). Les
          audits, revues, réunions, actions… se créent dans leur module et apparaissent
          automatiquement ici : utilisez le bouton « Planifier ».
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              name="titre"
              required
              placeholder="CODIR, fermeture annuelle, salon…"
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
