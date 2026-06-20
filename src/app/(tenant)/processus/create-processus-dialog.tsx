"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProcessusAction } from "@/lib/actions/processus";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function CreateProcessusDialog() {
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) =>
        createProcessusAction({
          nom: form.get("nom"),
          type: form.get("type"),
          description: form.get("description") || undefined,
        }),
      success: "Processus créé.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouveau processus</Button>} />
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nouveau processus</DialogTitle>
          <DialogDescription>Ajoutez un processus à la cartographie.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom du processus</Label>
            <Input id="nom" name="nom" required placeholder="Mise en mission" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" className={SELECT_CLASS} defaultValue="realisation">
              <option value="pilotage">Pilotage</option>
              <option value="realisation">Réalisation</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Création…" : "Créer le processus"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
