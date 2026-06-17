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
import { updateProcessusAction } from "@/lib/actions/processus";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ProcessusForEdit = {
  id: string;
  nom: string;
  type: "pilotage" | "realisation" | "support";
  description: string | null;
  entrees: string | null;
  sorties: string | null;
  ressources_associees: string | null;
};

export function EditProcessusDialog({ processus }: { processus: ProcessusForEdit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    const result = await updateProcessusAction({
      id: processus.id,
      nom: form.get("nom"),
      type: form.get("type"),
      description: form.get("description") || undefined,
      entrees: form.get("entrees") || undefined,
      sorties: form.get("sorties") || undefined,
      ressourcesAssociees: form.get("ressourcesAssociees") || undefined,
    });

    setPending(false);

    if (result.ok) {
      toast.success("Processus mis à jour.");
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
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="size-4" />
            Modifier
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="ressourcesAssociees">Ressources associées</Label>
            <Textarea
              id="ressourcesAssociees"
              name="ressourcesAssociees"
              rows={2}
              defaultValue={processus.ressources_associees ?? ""}
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
