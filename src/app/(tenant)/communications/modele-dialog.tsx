"use client";

import { Copy, Pencil, Plus } from "lucide-react";
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
import { createModeleAction, updateModeleAction } from "@/lib/actions/communications-modeles";
import { MODELE_CATEGORIES, type Modele } from "@/lib/communications";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";
import { ModelePiecesJointes } from "./modele-pieces-jointes";

type Mode = "creer" | "modifier" | "dupliquer";

/**
 * Crée un modèle, en modifie un personnalisé, ou duplique un modèle fourni
 * (la duplication crée une copie personnalisée éditable).
 */
export function ModeleDialog({ mode, modele }: { mode: Mode; modele?: Modele }) {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();
  const isModifier = mode === "modifier";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          categorie: f.get("categorie"),
          titre: f.get("titre"),
          objet: f.get("objet"),
          corps: f.get("corps") ?? "",
        };
        return isModifier && modele?.id
          ? updateModeleAction({ id: modele.id, ...data })
          : createModeleAction(data);
      },
      success: isModifier ? "Modèle mis à jour." : "Modèle enregistré.",
    });
  }

  const trigger =
    mode === "creer" ? (
      <Button className="gap-1.5">
        <Plus className="size-4" />
        Nouveau modèle
      </Button>
    ) : mode === "modifier" ? (
      <Button variant="ghost" size="sm" className="gap-1.5">
        <Pencil className="size-3.5" />
        Modifier
      </Button>
    ) : (
      <Button variant="ghost" size="sm" className="gap-1.5">
        <Copy className="size-3.5" />
        Personnaliser
      </Button>
    );

  // En duplication, on préremplit avec le contenu fourni mais sans id (= création).
  const titreDefaut =
    mode === "dupliquer" ? `${modele?.titre ?? ""} (copie)` : (modele?.titre ?? "");

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isModifier ? "Modifier le modèle" : "Nouveau modèle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <select
                id="categorie"
                name="categorie"
                className={SELECT_CLASS}
                defaultValue={modele?.categorie ?? "autre"}
              >
                {Object.entries(MODELE_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="titre">Titre du modèle</Label>
              <Input id="titre" name="titre" required defaultValue={titreDefaut} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="objet">Objet de l'e-mail</Label>
            <Input id="objet" name="objet" required defaultValue={modele?.objet ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="corps">Corps de l'e-mail</Label>
            <Textarea id="corps" name="corps" rows={10} defaultValue={modele?.corps ?? ""} />
            <p className="text-muted-foreground text-xs">
              Variables disponibles : {"{societe}"}, {"{destinataire}"}, {"{date}"} (remplacées à
              l'envoi).
            </p>
          </div>
          <Button type="submit" disabled={pending} className="mt-1 self-start">
            {pending ? "Enregistrement…" : isModifier ? "Enregistrer" : "Créer le modèle"}
          </Button>
        </form>

        {/* Pièces jointes : disponibles une fois le modèle personnalisé enregistré. */}
        {isModifier && modele && !modele.integre ? (
          <div className="mt-2 flex flex-col gap-2 border-t pt-4">
            <Label>Pièces jointes</Label>
            <ModelePiecesJointes modeleId={modele.id} pieces={modele.pieces ?? []} manage />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
