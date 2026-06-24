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
import { createIndicateurAction, updateIndicateurAction } from "@/lib/actions/indicateurs";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type IndicateurRow = {
  id: string;
  nom: string;
  description: string | null;
  processus_id: string | null;
  type: string;
  unite: string | null;
  formule_calcul: string | null;
  cible: number | null;
  sens: string;
  frequence_mesure: string;
};

/** Création et modification d'un indicateur (champs alignés sur la fiche de référence). */
export function IndicateurDialog({
  indicateur,
  processusOptions,
  presetProcessusId,
}: {
  indicateur?: IndicateurRow;
  processusOptions: { id: string; nom: string }[];
  presetProcessusId?: string;
}) {
  const isEdit = Boolean(indicateur);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) => {
        const data = {
          nom: form.get("nom"),
          description: form.get("description") || undefined,
          processusId: form.get("processusId") || undefined,
          type: form.get("type"),
          unite: form.get("unite") || undefined,
          formule: form.get("formule") || undefined,
          cible: form.get("cible") || undefined,
          sens: form.get("sens"),
          frequence: form.get("frequence"),
        };
        return isEdit
          ? updateIndicateurAction({ id: indicateur?.id, ...data })
          : createIndicateurAction(data);
      },
      success: isEdit ? "Indicateur mis à jour." : "Indicateur créé.",
    });
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="size-4" />
              Modifier
            </Button>
          ) : (
            <Button>Nouvel indicateur</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'indicateur" : "Nouvel indicateur"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={indicateur?.nom}
              placeholder="Taux de satisfaction client"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="formule">Méthode / formule de calcul</Label>
            <Textarea
              id="formule"
              name="formule"
              rows={2}
              defaultValue={indicateur?.formule_calcul ?? ""}
              placeholder="(Nombre de clients satisfaits ÷ Nombre total de répondants) × 100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={indicateur?.type ?? "percentage"}
              >
                <option value="numeric">Numérique</option>
                <option value="percentage">Pourcentage</option>
                <option value="count">Nombre</option>
                <option value="duration">Durée</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unite">Unité</Label>
              <Input
                id="unite"
                name="unite"
                defaultValue={indicateur?.unite ?? ""}
                placeholder="%, jours, €…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="frequence">Fréquence</Label>
              <select
                id="frequence"
                name="frequence"
                className={SELECT_CLASS}
                defaultValue={indicateur?.frequence_mesure ?? "mensuel"}
              >
                <option value="quotidien">Quotidienne</option>
                <option value="hebdo">Hebdomadaire</option>
                <option value="mensuel">Mensuelle</option>
                <option value="trimestriel">Trimestrielle</option>
                <option value="annuel">Annuelle</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus</Label>
              <select
                id="processusId"
                name="processusId"
                className={SELECT_CLASS}
                defaultValue={indicateur?.processus_id ?? presetProcessusId ?? ""}
              >
                <option value="">Aucun (global)</option>
                {processusOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cible">Cible</Label>
              <Input
                id="cible"
                name="cible"
                type="number"
                step="any"
                defaultValue={indicateur?.cible ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sens">Objectif</Label>
              <select
                id="sens"
                name="sens"
                className={SELECT_CLASS}
                defaultValue={indicateur?.sens ?? "hausse"}
              >
                <option value="hausse">À atteindre ou dépasser (≥ cible)</option>
                <option value="baisse">À ne pas dépasser (≤ cible)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={indicateur?.description ?? ""}
            />
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'indicateur"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Alias historique pour la création (utilisé par les pages liste et processus). */
export function CreateIndicateurDialog(props: {
  processusOptions: { id: string; nom: string }[];
  presetProcessusId?: string;
}) {
  return <IndicateurDialog {...props} />;
}
