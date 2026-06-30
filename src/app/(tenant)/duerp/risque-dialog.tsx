"use client";

import { Pencil, Plus } from "lucide-react";
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
import { createRisqueAction, updateRisqueAction } from "@/lib/actions/duerp";
import { DUERP_FREQUENCE_LABELS, DUERP_GRAVITE_LABELS, DUERP_STATUT_LABELS } from "@/lib/duerp";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type RisqueRow = {
  id: string;
  unite_id: string;
  famille_id: string | null;
  danger: string;
  situation_exposition: string | null;
  gravite_brute: number;
  frequence_brute: number;
  mesures_existantes: string | null;
  gravite_residuelle: number | null;
  frequence_residuelle: number | null;
  statut: string;
};

export function RisqueDialog({
  uniteId,
  risque,
  familles,
  trigger,
}: {
  uniteId: string;
  risque?: RisqueRow;
  familles: { id: string; libelle: string }[];
  trigger?: React.ReactElement;
}) {
  const isEdit = Boolean(risque);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          uniteId,
          familleId: f.get("familleId") || undefined,
          danger: f.get("danger"),
          situationExposition: f.get("situationExposition") || undefined,
          graviteBrute: f.get("graviteBrute"),
          frequenceBrute: f.get("frequenceBrute"),
          mesuresExistantes: f.get("mesuresExistantes") || undefined,
          graviteResiduelle: f.get("graviteResiduelle") || undefined,
          frequenceResiduelle: f.get("frequenceResiduelle") || undefined,
          statut: f.get("statut"),
        };
        if (isEdit) return updateRisqueAction({ id: risque?.id, ...data });
        return createRisqueAction(data);
      },
      success: isEdit ? "Risque mis à jour." : "Risque ajouté.",
    });
  }

  if (readOnly) return isEdit ? (trigger ?? null) : null;

  const cotes = [1, 2, 3, 4];

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
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Ajouter un risque
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le risque" : "Nouveau risque"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="familleId">Famille de risque</Label>
              <select
                id="familleId"
                name="familleId"
                className={SELECT_CLASS}
                defaultValue={risque?.famille_id ?? ""}
              >
                <option value="">—</option>
                {familles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={risque?.statut ?? "a_traiter"}
              >
                {Object.entries(DUERP_STATUT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="danger">Danger</Label>
            <Input
              id="danger"
              name="danger"
              required
              placeholder="Ex. Manipulation de charges lourdes"
              defaultValue={risque?.danger ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="situationExposition">Situation d'exposition</Label>
            <Textarea
              id="situationExposition"
              name="situationExposition"
              rows={2}
              placeholder="Qui est exposé, dans quelles circonstances"
              defaultValue={risque?.situation_exposition ?? ""}
            />
          </div>

          <fieldset className="rounded-xl border bg-muted/30 p-3">
            <legend className="px-1 font-medium text-sm">Cotation brute (avant mesures)</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="graviteBrute">Gravité</Label>
                <select
                  id="graviteBrute"
                  name="graviteBrute"
                  className={SELECT_CLASS}
                  defaultValue={String(risque?.gravite_brute ?? 1)}
                >
                  {cotes.map((n) => (
                    <option key={n} value={n}>
                      {DUERP_GRAVITE_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="frequenceBrute">Fréquence d'exposition</Label>
                <select
                  id="frequenceBrute"
                  name="frequenceBrute"
                  className={SELECT_CLASS}
                  defaultValue={String(risque?.frequence_brute ?? 1)}
                >
                  {cotes.map((n) => (
                    <option key={n} value={n}>
                      {DUERP_FREQUENCE_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mesuresExistantes">Mesures de prévention existantes</Label>
            <Textarea
              id="mesuresExistantes"
              name="mesuresExistantes"
              rows={2}
              defaultValue={risque?.mesures_existantes ?? ""}
            />
          </div>

          <fieldset className="rounded-xl border bg-muted/30 p-3">
            <legend className="px-1 font-medium text-sm">
              Cotation résiduelle (après mesures) — facultatif
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="graviteResiduelle">Gravité</Label>
                <select
                  id="graviteResiduelle"
                  name="graviteResiduelle"
                  className={SELECT_CLASS}
                  defaultValue={risque?.gravite_residuelle ? String(risque.gravite_residuelle) : ""}
                >
                  <option value="">—</option>
                  {cotes.map((n) => (
                    <option key={n} value={n}>
                      {DUERP_GRAVITE_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="frequenceResiduelle">Fréquence d'exposition</Label>
                <select
                  id="frequenceResiduelle"
                  name="frequenceResiduelle"
                  className={SELECT_CLASS}
                  defaultValue={
                    risque?.frequence_residuelle ? String(risque.frequence_residuelle) : ""
                  }
                >
                  <option value="">—</option>
                  {cotes.map((n) => (
                    <option key={n} value={n}>
                      {DUERP_FREQUENCE_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
