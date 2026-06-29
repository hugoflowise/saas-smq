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
import { createCompetenceAction, updateCompetenceAction } from "@/lib/actions/competences";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

export type CompetenceRow = {
  id: string;
  libelle: string;
  categorie: string | null;
  description: string | null;
};

export function CompetenceDialog({
  competence,
  trigger,
}: {
  competence?: CompetenceRow;
  trigger?: React.ReactElement;
}) {
  const isEdit = Boolean(competence);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          libelle: f.get("libelle"),
          categorie: f.get("categorie") || undefined,
          description: f.get("description") || undefined,
        };
        return isEdit
          ? updateCompetenceAction({ id: competence?.id, ...data })
          : createCompetenceAction(data);
      },
      success: isEdit ? "Compétence mise à jour." : "Compétence ajoutée.",
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
            <Button variant="outline">Nouvelle compétence</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la compétence" : "Nouvelle compétence"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input id="libelle" name="libelle" required defaultValue={competence?.libelle ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="categorie">Catégorie</Label>
            <Input
              id="categorie"
              name="categorie"
              defaultValue={competence?.categorie ?? ""}
              placeholder="ex. Habilitation, Métier, Sécurité…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={competence?.description ?? ""}
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
