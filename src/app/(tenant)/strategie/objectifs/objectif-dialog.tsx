"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
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
import { createObjectifAction, updateObjectifAction } from "@/lib/actions/registres";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type ObjectifRow = {
  id: string;
  intitule: string;
  description: string | null;
  cible_chiffree: string | null;
  echeance: string | null;
  fonction_concernee: string | null;
  statut: string;
  valeur_cible: number | null;
  valeur_actuelle: number | null;
  unite: string | null;
  sens: string | null;
  processus_id: string | null;
  indicateur_id: string | null;
  engagement_id?: string | null;
};

export function ObjectifDialog({
  objectif,
  processusOptions = [],
  indicateurOptions = [],
  engagementOptions = [],
  linkedIndicateurIds = [],
  presetProcessusId,
  presetEngagementId,
}: {
  objectif?: ObjectifRow;
  processusOptions?: { id: string; nom: string }[];
  indicateurOptions?: { id: string; nom: string }[];
  engagementOptions?: { id: string; libelle: string }[];
  linkedIndicateurIds?: string[];
  presetProcessusId?: string;
  presetEngagementId?: string;
}) {
  const isEdit = Boolean(objectif);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();
  const [indicateurIds, setIndicateurIds] = useState<string[]>(linkedIndicateurIds);

  function toggleIndicateur(id: string) {
    setIndicateurIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          intitule: f.get("intitule"),
          description: f.get("description") || undefined,
          echeance: f.get("echeance") || undefined,
          fonctionConcernee: f.get("fonctionConcernee") || undefined,
          statut: f.get("statut"),
          processusId: f.get("processusId") || undefined,
          engagementId: f.get("engagementId") || undefined,
          indicateurIds,
        };
        return isEdit
          ? updateObjectifAction({ id: objectif?.id, ...data })
          : createObjectifAction(data);
      },
      success: isEdit ? "Objectif mis à jour." : "Objectif créé.",
    });
  }

  // Lecture seule : on masque le bouton de création comme le crayon d'édition.
  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>Nouvel objectif</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'objectif" : "Nouvel objectif qualité"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="intitule">Intitulé</Label>
            <Input id="intitule" name="intitule" required defaultValue={objectif?.intitule ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus pilote</Label>
              <select
                id="processusId"
                name="processusId"
                className={SELECT_CLASS}
                defaultValue={objectif?.processus_id ?? presetProcessusId ?? ""}
              >
                <option value="">-</option>
                {processusOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="engagementId">Engagement de la politique</Label>
              <select
                id="engagementId"
                name="engagementId"
                className={SELECT_CLASS}
                defaultValue={objectif?.engagement_id ?? presetEngagementId ?? ""}
              >
                <option value="">-</option>
                {engagementOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="echeance">Échéance</Label>
              <Input
                id="echeance"
                name="echeance"
                type="date"
                defaultValue={objectif?.echeance ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fonctionConcernee">Fonction concernée</Label>
              <Input
                id="fonctionConcernee"
                name="fonctionConcernee"
                defaultValue={objectif?.fonction_concernee ?? ""}
                placeholder="BM, RH…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={objectif?.statut ?? "actif"}
              >
                <option value="actif">Actif</option>
                <option value="atteint">Atteint</option>
                <option value="abandonne">Abandonné</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Indicateurs de mesure</Label>
            {indicateurOptions.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-2 text-muted-foreground text-xs">
                Aucun indicateur disponible. Créez vos indicateurs dans Pilotage → Indicateurs, puis
                revenez les rattacher ici.
              </p>
            ) : (
              <div className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                {indicateurOptions.map((i) => (
                  <label
                    key={i.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={indicateurIds.includes(i.id)}
                      onChange={() => toggleIndicateur(i.id)}
                    />
                    {i.nom}
                  </label>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Rattachez le ou les indicateurs qui mesurent cet objectif (ISO 9001 §6.2/§9.1). La
              progression de l'objectif est calculée à partir de ses indicateurs : chacun porte sa
              propre cible et son sens (définis dans Pilotage → Indicateurs). L'objectif est atteint
              quand tous ses indicateurs atteignent leur cible.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={objectif?.description ?? ""}
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
