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
import { createIndicateurAction, updateIndicateurAction } from "@/lib/actions/indicateurs";
import { DOMAINE_SSE_LABELS, DOMAINES_SSE } from "@/lib/domaines-sse";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { objectifsLabel } from "@/lib/normes-libelles";
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
  domaine?: string | null;
};

/** Création et modification d'un indicateur (champs alignés sur la fiche de référence). */
export function IndicateurDialog({
  indicateur,
  processusOptions,
  presetProcessusId,
  objectifOptions = [],
  linkedObjectifIds = [],
  afficherDomaine = false,
  afficherProcessus = true,
  normes = ["9001"],
}: {
  indicateur?: IndicateurRow;
  processusOptions: { id: string; nom: string }[];
  presetProcessusId?: string;
  objectifOptions?: { id: string; intitule: string }[];
  linkedObjectifIds?: string[];
  /** Affiche le sélecteur de domaine SSE (MASE §1.4). */
  afficherDomaine?: boolean;
  /** Affiche le rattachement au processus (approche processus, hors MASE). */
  afficherProcessus?: boolean;
  /** Normes actives du client (libellés dynamiques). */
  normes?: string[];
}) {
  const isEdit = Boolean(indicateur);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();
  const [objectifIds, setObjectifIds] = useState<string[]>(linkedObjectifIds);

  function toggleObjectif(id: string) {
    setObjectifIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

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
          domaine: form.get("domaine") || undefined,
          objectifIds,
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
              placeholder="Ex. taux de réalisation, délai moyen…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="formule">Méthode / formule de calcul</Label>
            <Textarea
              id="formule"
              name="formule"
              rows={2}
              defaultValue={indicateur?.formule_calcul ?? ""}
              placeholder="Ex. (nombre atteint ÷ nombre total) × 100"
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
            {afficherProcessus ? (
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
            ) : null}
            {afficherDomaine ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="domaine">Domaine SSE</Label>
                <select
                  id="domaine"
                  name="domaine"
                  className={SELECT_CLASS}
                  defaultValue={indicateur?.domaine ?? ""}
                >
                  <option value="">-</option>
                  {DOMAINES_SSE.map((d) => (
                    <option key={d} value={d}>
                      {DOMAINE_SSE_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
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

          <div className="flex flex-col gap-2">
            <Label>{objectifsLabel(normes)} mesurés</Label>
            {objectifOptions.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-2 text-muted-foreground text-xs">
                Aucun objectif disponible. Créez vos objectifs dans Stratégie → Objectifs.
              </p>
            ) : (
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                {objectifOptions.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={objectifIds.includes(o.id)}
                      onChange={() => toggleObjectif(o.id)}
                    />
                    {o.intitule}
                  </label>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Rattachez cet indicateur aux objectifs qu'il mesure (facultatif). Le lien apparaît
              aussi côté objectif.
            </p>
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
  objectifOptions?: { id: string; intitule: string }[];
  afficherDomaine?: boolean;
  afficherProcessus?: boolean;
  normes?: string[];
}) {
  return <IndicateurDialog {...props} />;
}
