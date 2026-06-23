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
import { createConsultantAction, updateConsultantAction } from "@/lib/actions/consultants";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

export type ConsultantRow = {
  id: string;
  reference: string | null;
  nom: string;
  prenom: string | null;
  entite: string | null;
  poste: string | null;
  date_demarrage: string | null;
  date_fin: string | null;
  odm: boolean;
  pdp: boolean;
  visite_medicale: boolean;
};

export function ConsultantDialog({
  consultant,
  trigger,
}: {
  consultant?: ConsultantRow;
  trigger?: React.ReactElement;
}) {
  const isEdit = Boolean(consultant);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          reference: f.get("reference") || undefined,
          nom: f.get("nom"),
          prenom: f.get("prenom") || undefined,
          entite: f.get("entite") || undefined,
          poste: f.get("poste") || undefined,
          dateDemarrage: f.get("dateDemarrage") || undefined,
          dateFin: f.get("dateFin") || undefined,
          odm: f.get("odm") === "on",
          pdp: f.get("pdp") === "on",
          visiteMedicale: f.get("visiteMedicale") === "on",
        };
        return isEdit
          ? updateConsultantAction({ id: consultant?.id, ...data })
          : createConsultantAction(data);
      },
      success: isEdit ? "Consultant mis à jour." : "Consultant ajouté.",
    });
  }

  if (readOnly) return isEdit ? (trigger ?? null) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            (trigger ?? (
              <Button variant="ghost" size="icon" aria-label="Modifier">
                <Pencil className="size-4" />
              </Button>
            ))
          ) : (
            <Button>Nouveau consultant</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le consultant" : "Nouveau consultant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" name="prenom" defaultValue={consultant?.prenom ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" required defaultValue={consultant?.nom ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="entite">Entité / agence</Label>
              <Input id="entite" name="entite" defaultValue={consultant?.entite ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="poste">Poste / mission</Label>
              <Input id="poste" name="poste" defaultValue={consultant?.poste ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateDemarrage">Date de démarrage</Label>
              <Input
                id="dateDemarrage"
                name="dateDemarrage"
                type="date"
                defaultValue={consultant?.date_demarrage ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateFin">Date de fin (sortie)</Label>
              <Input
                id="dateFin"
                name="dateFin"
                type="date"
                defaultValue={consultant?.date_fin ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Référence (Boond)</Label>
              <Input id="reference" name="reference" defaultValue={consultant?.reference ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border bg-surface p-3">
            <span className="font-medium text-sm">Conformité</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="odm"
                defaultChecked={consultant?.odm ?? false}
                className="size-4"
              />
              Ordre de mission à jour
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="pdp"
                defaultChecked={consultant?.pdp ?? false}
                className="size-4"
              />
              Plan de prévention à jour
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="visiteMedicale"
                defaultChecked={consultant?.visite_medicale ?? false}
                className="size-4"
              />
              Visite médicale à jour
            </label>
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
