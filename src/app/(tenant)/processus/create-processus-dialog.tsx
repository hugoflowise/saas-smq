"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateProcessusDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    const result = await createProcessusAction({
      nom: form.get("nom"),
      type: form.get("type"),
      description: form.get("description") || undefined,
    });

    setPending(false);

    if (result.ok) {
      toast.success("Processus créé.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouveau processus</Button>} />
      <DialogContent className="sm:max-w-md">
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
