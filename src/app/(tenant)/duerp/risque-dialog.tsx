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
import {
  DUERP_FREQUENCE_LABELS,
  DUERP_FREQUENCE_VALUES,
  DUERP_GRAVITE_LABELS,
  DUERP_GRAVITE_VALUES,
  DUERP_MAITRISE_LABELS,
  DUERP_MAITRISE_VALUES,
  DUERP_STATUT_LABELS,
} from "@/lib/duerp";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type RisqueRow = {
  id: string;
  unite_id: string;
  famille_id: string | null;
  danger: string;
  dommages: string | null;
  gravite: number;
  frequence: number;
  actions_existantes: string | null;
  maitrise: number;
  actions_a_mettre: string | null;
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
          dommages: f.get("dommages") || undefined,
          gravite: f.get("gravite"),
          frequence: f.get("frequence"),
          actionsExistantes: f.get("actionsExistantes") || undefined,
          maitrise: f.get("maitrise"),
          actionsAMettre: f.get("actionsAMettre") || undefined,
          statut: f.get("statut"),
        };
        if (isEdit) return updateRisqueAction({ id: risque?.id, ...data });
        return createRisqueAction(data);
      },
      success: isEdit ? "Risque mis à jour." : "Risque ajouté.",
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="danger">Situation dangereuse</Label>
            <Input
              id="danger"
              name="danger"
              required
              placeholder="Ex. Déplacement dans les locaux, Travail sur écran…"
              defaultValue={risque?.danger ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dommages">Risques / dommages éventuels</Label>
            <Textarea
              id="dommages"
              name="dommages"
              rows={2}
              placeholder="Ex. Chute de plain-pied, TMS, fatigue…"
              defaultValue={risque?.dommages ?? ""}
            />
          </div>
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

          <fieldset className="rounded-xl border bg-muted/30 p-3">
            <legend className="px-1 font-medium text-sm">
              Risque initial — Ri = Gravité × Fréquence
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="gravite">Gravité (G)</Label>
                <select
                  id="gravite"
                  name="gravite"
                  className={SELECT_CLASS}
                  defaultValue={String(risque?.gravite ?? 2)}
                >
                  {DUERP_GRAVITE_VALUES.map((n) => (
                    <option key={n} value={n}>
                      {DUERP_GRAVITE_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="frequence">Fréquence d'exposition (F)</Label>
                <select
                  id="frequence"
                  name="frequence"
                  className={SELECT_CLASS}
                  defaultValue={String(risque?.frequence ?? 2)}
                >
                  {DUERP_FREQUENCE_VALUES.map((n) => (
                    <option key={n} value={n}>
                      {DUERP_FREQUENCE_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="actionsExistantes">Actions existantes (mesures en place)</Label>
            <Textarea
              id="actionsExistantes"
              name="actionsExistantes"
              rows={2}
              defaultValue={risque?.actions_existantes ?? ""}
            />
          </div>

          <fieldset className="rounded-xl border bg-muted/30 p-3">
            <legend className="px-1 font-medium text-sm">
              Risque résiduel — Rr = arrondi(Ri ÷ Maîtrise)
            </legend>
            <div className="flex flex-col gap-2">
              <Label htmlFor="maitrise">Niveau de maîtrise (M)</Label>
              <select
                id="maitrise"
                name="maitrise"
                className={SELECT_CLASS}
                defaultValue={String(risque?.maitrise ?? 1)}
              >
                {DUERP_MAITRISE_VALUES.map((n) => (
                  <option key={n} value={n}>
                    {DUERP_MAITRISE_LABELS[n]}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="actionsAMettre">Action(s) à mettre en place</Label>
            <Textarea
              id="actionsAMettre"
              name="actionsAMettre"
              rows={2}
              defaultValue={risque?.actions_a_mettre ?? ""}
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
