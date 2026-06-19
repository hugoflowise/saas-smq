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
import { createReclamationAction, updateReclamationAction } from "@/lib/actions/registres";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ReclamationRow = {
  id: string;
  objet: string;
  client: string | null;
  date_reception: string;
  canal: string;
  gravite: string;
  description: string | null;
  traitement: string | null;
  statut: string;
};

export function ReclamationDialog({ reclamation }: { reclamation?: ReclamationRow }) {
  const router = useRouter();
  const isEdit = Boolean(reclamation);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      objet: f.get("objet"),
      client: f.get("client") || undefined,
      dateReception: f.get("dateReception") || undefined,
      canal: f.get("canal"),
      gravite: f.get("gravite"),
      description: f.get("description") || undefined,
      traitement: f.get("traitement") || undefined,
      statut: f.get("statut"),
    };
    const result = isEdit
      ? await updateReclamationAction({ id: reclamation?.id, ...data })
      : await createReclamationAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Réclamation mise à jour." : "Réclamation enregistrée.");
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
            <Button>Nouvelle réclamation</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la réclamation" : "Nouvelle réclamation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="objet">Objet</Label>
            <Input id="objet" name="objet" required defaultValue={reclamation?.objet ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" name="client" defaultValue={reclamation?.client ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateReception">Date de réception</Label>
              <Input
                id="dateReception"
                name="dateReception"
                type="date"
                defaultValue={reclamation?.date_reception ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="canal">Canal</Label>
              <select
                id="canal"
                name="canal"
                className={SELECT_CLASS}
                defaultValue={reclamation?.canal ?? "mail"}
              >
                <option value="mail">E-mail</option>
                <option value="tel">Téléphone</option>
                <option value="visio">Visio</option>
                <option value="audit">Audit</option>
                <option value="enquete">Enquête</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gravite">Gravité</Label>
              <select
                id="gravite"
                name="gravite"
                className={SELECT_CLASS}
                defaultValue={reclamation?.gravite ?? "mineure"}
              >
                <option value="mineure">Mineure</option>
                <option value="majeure">Majeure</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={reclamation?.statut ?? "recue"}
              >
                <option value="recue">Reçue</option>
                <option value="analysee">Analysée</option>
                <option value="traitee">Traitée</option>
                <option value="cloturee">Clôturée</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={reclamation?.description ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="traitement">Traitement / réponse</Label>
            <Textarea
              id="traitement"
              name="traitement"
              rows={2}
              defaultValue={reclamation?.traitement ?? ""}
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
