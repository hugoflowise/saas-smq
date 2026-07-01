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
import { addLigneAction, updateLigneAction } from "@/lib/actions/analyses-risques";
import { DOMAINE_SSE_LABELS, DOMAINES_SSE } from "@/lib/domaines-sse";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type LigneRow = {
  id: string;
  tache: string;
  domaine: string;
  danger: string | null;
  gravite: number;
  probabilite: number;
  mesures_prevention: string | null;
  risque_residuel: string | null;
};

const COTATION = [1, 2, 3, 4];

/** Ajout / modification d'une situation de travail (ligne d'analyse). */
export function LigneDialog({ analyseId, ligne }: { analyseId: string; ligne?: LigneRow }) {
  const isEdit = Boolean(ligne);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) => {
        const data = {
          analyseId,
          tache: form.get("tache"),
          domaine: form.get("domaine"),
          danger: form.get("danger") || undefined,
          gravite: form.get("gravite"),
          probabilite: form.get("probabilite"),
          mesuresPrevention: form.get("mesuresPrevention") || undefined,
          risqueResiduel: form.get("risqueResiduel") || undefined,
        };
        return isEdit ? updateLigneAction({ id: ligne?.id, ...data }) : addLigneAction(data);
      },
      success: isEdit ? "Situation mise à jour." : "Situation ajoutée.",
    });
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" className="size-8" aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="size-4" />
              Ajouter une situation
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la situation" : "Nouvelle situation de travail"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tache">Tâche / situation de travail</Label>
            <Input
              id="tache"
              name="tache"
              required
              defaultValue={ligne?.tache}
              placeholder="Manutention de charges, travail en hauteur…"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="domaine">Domaine</Label>
              <select
                id="domaine"
                name="domaine"
                className={SELECT_CLASS}
                defaultValue={ligne?.domaine ?? "securite"}
              >
                {DOMAINES_SSE.map((d) => (
                  <option key={d} value={d}>
                    {DOMAINE_SSE_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gravite">Gravité (1-4)</Label>
              <select
                id="gravite"
                name="gravite"
                className={SELECT_CLASS}
                defaultValue={ligne?.gravite ?? 1}
              >
                {COTATION.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="probabilite">Probabilité (1-4)</Label>
              <select
                id="probabilite"
                name="probabilite"
                className={SELECT_CLASS}
                defaultValue={ligne?.probabilite ?? 1}
              >
                {COTATION.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="danger">Danger / risque</Label>
            <Textarea
              id="danger"
              name="danger"
              rows={2}
              defaultValue={ligne?.danger ?? ""}
              placeholder="Description du danger et du dommage possible"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mesuresPrevention">Mesures de prévention</Label>
            <Textarea
              id="mesuresPrevention"
              name="mesuresPrevention"
              rows={2}
              defaultValue={ligne?.mesures_prevention ?? ""}
              placeholder="Moyens de maîtrise (protection collective, EPI, consignes…)"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="risqueResiduel">Risque résiduel</Label>
            <Input
              id="risqueResiduel"
              name="risqueResiduel"
              defaultValue={ligne?.risque_residuel ?? ""}
              placeholder="Facultatif"
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
