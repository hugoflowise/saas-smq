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
import { createPiAction, updatePiAction } from "@/lib/actions/contexte";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type PiRow = {
  id: string;
  nom: string;
  type: string;
  attentes: string | null;
  exigences: string | null;
  niveau_influence: string;
};

export function PiDialog({ pi }: { pi?: PiRow }) {
  const router = useRouter();
  const isEdit = Boolean(pi);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const data = {
      nom: form.get("nom"),
      type: form.get("type"),
      attentes: form.get("attentes") || undefined,
      exigences: form.get("exigences") || undefined,
      niveauInfluence: form.get("niveauInfluence"),
    };
    const result = isEdit
      ? await updatePiAction({ id: pi?.id, ...data })
      : await createPiAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Partie prenante mise à jour." : "Partie prenante créée.");
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
          isEdit ? (
            <Button variant="ghost" size="icon" aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>Nouvelle partie prenante</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier" : "Nouvelle partie prenante"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={pi?.nom ?? ""}
              placeholder="Clients grands comptes"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={pi?.type ?? "client"}
              >
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
                <option value="collaborateur">Collaborateur</option>
                <option value="autorite">Autorité</option>
                <option value="actionnaire">Actionnaire</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="niveauInfluence">Influence</Label>
              <select
                id="niveauInfluence"
                name="niveauInfluence"
                className={SELECT_CLASS}
                defaultValue={pi?.niveau_influence ?? "moyen"}
              >
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="fort">Fort</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="attentes">Attentes</Label>
            <Textarea id="attentes" name="attentes" rows={2} defaultValue={pi?.attentes ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="exigences">Exigences</Label>
            <Textarea id="exigences" name="exigences" rows={2} defaultValue={pi?.exigences ?? ""} />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
