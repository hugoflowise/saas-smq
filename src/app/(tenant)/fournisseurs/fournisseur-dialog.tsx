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
import { createFournisseurAction, updateFournisseurAction } from "@/lib/actions/fournisseurs";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type FournisseurRow = {
  id: string;
  nom: string;
  categorie: string | null;
  contact: string | null;
  criticite: string;
  note_evaluation: number | null;
  date_evaluation: string | null;
  prochaine_evaluation: string | null;
  statut: string;
  commentaire: string | null;
};

export function FournisseurDialog({ fournisseur }: { fournisseur?: FournisseurRow }) {
  const isEdit = Boolean(fournisseur);
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          nom: f.get("nom"),
          categorie: f.get("categorie") || undefined,
          contact: f.get("contact") || undefined,
          criticite: f.get("criticite"),
          noteEvaluation: f.get("noteEvaluation") || undefined,
          dateEvaluation: f.get("dateEvaluation") || undefined,
          prochaineEvaluation: f.get("prochaineEvaluation") || undefined,
          statut: f.get("statut"),
          commentaire: f.get("commentaire") || undefined,
        };
        return isEdit
          ? updateFournisseurAction({ id: fournisseur?.id, ...data })
          : createFournisseurAction(data);
      },
      success: isEdit ? "Fournisseur mis à jour." : "Fournisseur ajouté.",
    });
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
            <Button>Nouveau fournisseur</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" required defaultValue={fournisseur?.nom ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <Input
                id="categorie"
                name="categorie"
                defaultValue={fournisseur?.categorie ?? ""}
                placeholder="Formation, EPI, intérim, banque, mutuelle…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact">Contact</Label>
              <Input id="contact" name="contact" defaultValue={fournisseur?.contact ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="criticite">Criticité</Label>
              <select
                id="criticite"
                name="criticite"
                className={SELECT_CLASS}
                defaultValue={fournisseur?.criticite ?? "moyenne"}
              >
                <option value="faible">Faible</option>
                <option value="moyenne">Moyenne</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={fournisseur?.statut ?? "actif"}
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="noteEvaluation">Évaluation (1 à 5)</Label>
              <Input
                id="noteEvaluation"
                name="noteEvaluation"
                type="number"
                min={1}
                max={5}
                defaultValue={fournisseur?.note_evaluation ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateEvaluation">Date d'évaluation</Label>
              <Input
                id="dateEvaluation"
                name="dateEvaluation"
                type="date"
                defaultValue={fournisseur?.date_evaluation ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prochaineEvaluation">Prochaine évaluation</Label>
              <Input
                id="prochaineEvaluation"
                name="prochaineEvaluation"
                type="date"
                defaultValue={fournisseur?.prochaine_evaluation ?? ""}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={3}
              defaultValue={fournisseur?.commentaire ?? ""}
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
