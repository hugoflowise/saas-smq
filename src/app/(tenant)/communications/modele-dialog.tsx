"use client";

import { Pencil, Plus } from "lucide-react";
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
import {
  createModeleAction,
  materialiserModeleAction,
  updateModeleAction,
} from "@/lib/actions/communications-modeles";
import { MODELE_CATEGORIES, type Modele, type ModelePiece } from "@/lib/communications";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { SELECT_CLASS } from "@/lib/ui-classes";
import { ModelePiecesJointes } from "./modele-pieces-jointes";

type Mode = "creer" | "modifier";

/**
 * Crée un modèle ou en modifie un (fourni OU personnalisé - même logique).
 * Un modèle fourni est « matérialisé » (copié en base) au premier enregistrement.
 * Après le premier enregistrement, la section Pièces jointes apparaît : on peut
 * ainsi attacher une PJ dès la création, sans devoir rouvrir en modification.
 */
export function ModeleDialog({ mode, modele }: { mode: Mode; modele?: Modele }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // Id de la ligne en base : déjà présent pour un modèle personnalisé, sinon posé
  // au premier enregistrement (création ou matérialisation d'un modèle fourni).
  const existingId = modele && !modele.integre ? modele.id : null;
  const [savedId, setSavedId] = useState<string | null>(existingId);
  const [pieces, setPieces] = useState<ModelePiece[]>(modele?.pieces ?? []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const data = {
      categorie: f.get("categorie"),
      titre: f.get("titre"),
      objet: f.get("objet"),
      corps: f.get("corps") ?? "",
    };
    setPending(true);
    if (savedId) {
      const r = await updateModeleAction({ id: savedId, ...data });
      setPending(false);
      if (!r.ok) return toast.error(r.error);
    } else {
      const r = await createModeleAction({
        ...data,
        // Matérialisation d'un modèle fourni : on garde le lien vers l'origine.
        modeleSource: modele?.integre ? modele.id : undefined,
      });
      setPending(false);
      if (!r.ok) return toast.error(r.error);
      // On récupère l'id pour révéler la section pièces jointes.
      setSavedId(r.id);
    }
    toast.success("Modèle enregistré.");
  }

  // À l'ouverture d'un modèle fourni, on le matérialise (copie éditable) pour que
  // la section Pièces jointes soit disponible tout de suite.
  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !savedId && modele?.integre) {
      const r = await materialiserModeleAction(modele.id);
      if (r.ok) {
        setSavedId(r.id);
        setPieces(r.pieces);
      } else {
        toast.error(r.error);
      }
    }
    if (!next && savedId) router.refresh();
  }

  const trigger =
    mode === "creer" ? (
      <Button className="gap-1.5">
        <Plus className="size-4" />
        Nouveau modèle
      </Button>
    ) : (
      <Button variant="ghost" size="sm" className="gap-1.5">
        <Pencil className="size-3.5" />
        Modifier
      </Button>
    );

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "creer" ? "Nouveau modèle" : "Modifier le modèle"}</DialogTitle>
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
              <Input id="titre" name="titre" required defaultValue={modele?.titre ?? ""} />
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
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>

        {/* Pièces jointes : disponibles dès que le modèle existe en base. */}
        {savedId ? (
          <div className="mt-2 flex flex-col gap-2 border-t pt-4">
            <Label>Pièces jointes</Label>
            <ModelePiecesJointes modeleId={savedId} pieces={pieces} manage />
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            Enregistrez le modèle pour pouvoir y joindre un fichier.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
