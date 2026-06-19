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
import { createVeilleAction, updateVeilleAction } from "@/lib/actions/registres";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type VeilleRow = {
  id: string;
  reference: string | null;
  intitule: string;
  domaine: string;
  date_publication: string | null;
  date_application: string | null;
  impact_smq: string | null;
  actions_a_prevoir: string | null;
  statut: string;
};

export function VeilleDialog({ veille }: { veille?: VeilleRow }) {
  const router = useRouter();
  const isEdit = Boolean(veille);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      intitule: f.get("intitule"),
      reference: f.get("reference") || undefined,
      domaine: f.get("domaine"),
      datePublication: f.get("datePublication") || undefined,
      dateApplication: f.get("dateApplication") || undefined,
      impactSmq: f.get("impactSmq") || undefined,
      actionsAPrevoir: f.get("actionsAPrevoir") || undefined,
      statut: f.get("statut"),
    };
    const result = isEdit
      ? await updateVeilleAction({ id: veille?.id, ...data })
      : await createVeilleAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Texte mis à jour." : "Texte ajouté à la veille.");
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
            <Button>Nouveau texte</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le texte" : "Nouveau texte de veille"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="intitule">Intitulé</Label>
            <Input id="intitule" name="intitule" required defaultValue={veille?.intitule ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                name="reference"
                defaultValue={veille?.reference ?? ""}
                placeholder="Code du travail Art. L4121-1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="domaine">Domaine</Label>
              <select
                id="domaine"
                name="domaine"
                className={SELECT_CLASS}
                defaultValue={veille?.domaine ?? "qualite"}
              >
                <option value="travail">Travail</option>
                <option value="qualite">Qualité</option>
                <option value="environnement">Environnement</option>
                <option value="securite">Sécurité</option>
                <option value="rgpd">RGPD</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="datePublication">Publication</Label>
              <Input
                id="datePublication"
                name="datePublication"
                type="date"
                defaultValue={veille?.date_publication ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateApplication">Application</Label>
              <Input
                id="dateApplication"
                name="dateApplication"
                type="date"
                defaultValue={veille?.date_application ?? ""}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={veille?.statut ?? "a_analyser"}
              >
                <option value="a_analyser">À analyser</option>
                <option value="analysee">Analysée</option>
                <option value="integree">Intégrée</option>
                <option value="sans_objet">Sans objet</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="impactSmq">Impact SMQ</Label>
            <Textarea
              id="impactSmq"
              name="impactSmq"
              rows={2}
              defaultValue={veille?.impact_smq ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="actionsAPrevoir">Actions à prévoir</Label>
            <Textarea
              id="actionsAPrevoir"
              name="actionsAPrevoir"
              rows={2}
              defaultValue={veille?.actions_a_prevoir ?? ""}
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
