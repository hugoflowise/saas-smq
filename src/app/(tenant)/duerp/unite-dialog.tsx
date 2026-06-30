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
import { createUniteAction, updateUniteAction } from "@/lib/actions/duerp";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

export type UniteRow = {
  id: string;
  libelle: string;
  description: string | null;
  effectif_concerne: number | null;
};

export function UniteDialog({
  unite,
  trigger,
}: {
  unite?: UniteRow;
  trigger?: React.ReactElement;
}) {
  const isEdit = Boolean(unite);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          libelle: f.get("libelle"),
          description: f.get("description") || undefined,
          effectifConcerne: f.get("effectifConcerne") || undefined,
        };
        if (isEdit) return updateUniteAction({ id: unite?.id, ...data });
        return createUniteAction(data);
      },
      success: isEdit ? "Unité de travail mise à jour." : "Unité de travail ajoutée.",
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
            <Button>Nouvelle unité de travail</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'unité de travail" : "Nouvelle unité de travail"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input
              id="libelle"
              name="libelle"
              required
              placeholder="Ex. Atelier, Chantier, Bureau, Déplacements"
              defaultValue={unite?.libelle ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="effectifConcerne">Effectif concerné</Label>
            <Input
              id="effectifConcerne"
              name="effectifConcerne"
              type="number"
              min={0}
              defaultValue={unite?.effectif_concerne ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={unite?.description ?? ""}
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
