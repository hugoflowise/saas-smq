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
import { createAttenteAction, updateAttenteAction } from "@/lib/actions/parties-prenantes";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { criticiteResiduelle, MAITRISE_LABELS } from "@/lib/parties-prenantes";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type AttenteRow = {
  id: string;
  attente: string;
  risque: string | null;
  opportunite: string | null;
  maitrise: string;
  moyens_maitrise: string | null;
  processus_id: string | null;
  integration_pa: boolean;
  action: string | null;
  commentaire: string | null;
};

export function AttenteDialog({
  partieId,
  priorite,
  processus,
  attente,
}: {
  partieId: string;
  priorite: number;
  processus: { id: string; nom: string }[];
  attente?: AttenteRow;
}) {
  const isEdit = Boolean(attente);
  const { open, setOpen, pending, submit } = useDialogForm();
  const [maitrise, setMaitrise] = useState(attente?.maitrise ?? "partiel");
  const readOnly = useReadOnly();

  const crit = criticiteResiduelle(priorite, maitrise);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          partieId,
          attente: f.get("attente"),
          risque: f.get("risque") || undefined,
          opportunite: f.get("opportunite") || undefined,
          maitrise,
          moyensMaitrise: f.get("moyensMaitrise") || undefined,
          processusId: f.get("processusId") || undefined,
          integrationPa: f.get("integrationPa") === "on",
          action: f.get("action") || undefined,
          commentaire: f.get("commentaire") || undefined,
        };
        return isEdit
          ? updateAttenteAction({ id: attente?.id, ...data })
          : createAttenteAction(data);
      },
      success: isEdit ? "Attente mise à jour." : "Attente ajoutée.",
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
            <Button>Ajouter une attente</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'attente" : "Nouvelle attente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="attente">Attente identifiée</Label>
            <Textarea
              id="attente"
              name="attente"
              rows={2}
              required
              defaultValue={attente?.attente ?? ""}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="risque">Risque si non prise en compte</Label>
              <Textarea id="risque" name="risque" rows={2} defaultValue={attente?.risque ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="opportunite">Opportunité si prise en compte</Label>
              <Textarea
                id="opportunite"
                name="opportunite"
                rows={2}
                defaultValue={attente?.opportunite ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="maitrise">Niveau de maîtrise</Label>
              <select
                id="maitrise"
                className={SELECT_CLASS}
                value={maitrise}
                onChange={(e) => setMaitrise(e.target.value)}
              >
                {Object.entries(MAITRISE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus concerné</Label>
              <select
                id="processusId"
                name="processusId"
                className={SELECT_CLASS}
                defaultValue={attente?.processus_id ?? ""}
              >
                <option value="">-</option>
                {processus.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="moyensMaitrise">Moyens de maîtrise</Label>
            <Textarea
              id="moyensMaitrise"
              name="moyensMaitrise"
              rows={2}
              defaultValue={attente?.moyens_maitrise ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="action">Action pour répondre à l'attente</Label>
            <Textarea id="action" name="action" rows={2} defaultValue={attente?.action ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire / recommandation</Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={2}
              defaultValue={attente?.commentaire ?? ""}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="integrationPa"
              defaultChecked={attente?.integration_pa ?? false}
              className="size-4"
            />
            Nécessité d'intégration au plan d'actions (PA-QSSE)
          </label>

          <div className="rounded-lg bg-muted/50 px-4 py-2.5 text-muted-foreground text-sm">
            Criticité résiduelle calculée :{" "}
            <span className="font-semibold text-foreground">{crit}</span> (priorité {priorite} ×
            maîtrise)
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
