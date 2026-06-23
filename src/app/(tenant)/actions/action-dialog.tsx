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
import { createActionAction, updateActionAction } from "@/lib/actions/plan-actions";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import {
  ACTION_ORIGINE_LABELS,
  ACTION_PRIORITE_LABELS,
  ACTION_STATUT_LABELS,
  ACTION_TYPE_LABELS,
} from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type ActionRow = {
  id: string;
  description_courte: string;
  description_detail: string | null;
  origine: string;
  type: string;
  priorite: string;
  statut: string;
  processus_concerne: string | null;
  date_prevue: string | null;
  indicateur_efficacite: string | null;
  commentaires: string | null;
  constat?: string | null;
  cause_fondamentale?: string | null;
  recommandation?: string | null;
  cotation?: string | null;
};

const COTATION_OPTIONS: Record<string, string> = {
  non_evalue: "Non évalué",
  conforme: "Conforme",
  point_attention: "Point d'attention",
  nc_mineure: "NC mineure",
  nc_majeure: "NC majeure",
};

type Props = {
  processusOptions: { id: string; nom: string }[];
  action?: ActionRow;
};

function Options({ map }: { map: Record<string, string> }) {
  return (
    <>
      {Object.entries(map).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  );
}

export function ActionDialog({ processusOptions, action }: Props) {
  const isEdit = Boolean(action);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) => {
        const payload = {
          descriptionCourte: form.get("descriptionCourte"),
          descriptionDetail: form.get("descriptionDetail") || undefined,
          origine: form.get("origine"),
          type: form.get("type"),
          priorite: form.get("priorite"),
          statut: form.get("statut"),
          processusConcerne: form.get("processusConcerne") || undefined,
          datePrevue: form.get("datePrevue") || undefined,
          indicateurEfficacite: form.get("indicateurEfficacite") || undefined,
          commentaires: form.get("commentaires") || undefined,
          cotation: form.get("cotation") || undefined,
          constat: form.get("constat") || undefined,
          causeFondamentale: form.get("causeFondamentale") || undefined,
          recommandation: form.get("recommandation") || undefined,
        };
        return isEdit
          ? updateActionAction({ id: action?.id, ...payload })
          : createActionAction(payload);
      },
      success: isEdit ? "Action mise à jour." : "Action créée.",
    });
  }

  // Lecture seule (auditeur) : masquer toute écriture. Pas de prop trigger ici,
  // donc on masque aussi bien le bouton « Nouvelle action » que l'icône crayon.
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
            <Button>Nouvelle action</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'action" : "Nouvelle action"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="descriptionCourte">Intitulé</Label>
            <Input
              id="descriptionCourte"
              name="descriptionCourte"
              required
              defaultValue={action?.description_courte ?? ""}
              placeholder="Mettre à jour la revue d'offre"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={action?.statut ?? "a_faire"}
              >
                <Options map={ACTION_STATUT_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="priorite">Priorité</Label>
              <select
                id="priorite"
                name="priorite"
                className={SELECT_CLASS}
                defaultValue={action?.priorite ?? "p2"}
              >
                <Options map={ACTION_PRIORITE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={action?.type ?? "corrective"}
              >
                <Options map={ACTION_TYPE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="origine">Origine</Label>
              <select
                id="origine"
                name="origine"
                className={SELECT_CLASS}
                defaultValue={action?.origine ?? "manuelle"}
              >
                <Options map={ACTION_ORIGINE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cotation">Cotation</Label>
              <select
                id="cotation"
                name="cotation"
                className={SELECT_CLASS}
                defaultValue={action?.cotation ?? "non_evalue"}
              >
                <Options map={COTATION_OPTIONS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusConcerne">Processus</Label>
              <select
                id="processusConcerne"
                name="processusConcerne"
                className={SELECT_CLASS}
                defaultValue={action?.processus_concerne ?? ""}
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
              <Label htmlFor="datePrevue">Échéance</Label>
              <Input
                id="datePrevue"
                name="datePrevue"
                type="date"
                defaultValue={action?.date_prevue ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="constat">Constat</Label>
            <Textarea
              id="constat"
              name="constat"
              rows={2}
              defaultValue={action?.constat ?? ""}
              placeholder="Ce qui a été observé (écart, situation)…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="causeFondamentale">Cause fondamentale</Label>
            <Textarea
              id="causeFondamentale"
              name="causeFondamentale"
              rows={2}
              defaultValue={action?.cause_fondamentale ?? ""}
              placeholder="Cause racine identifiée (5 Pourquoi, Ishikawa…)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descriptionDetail">Détail / action à mener</Label>
            <Textarea
              id="descriptionDetail"
              name="descriptionDetail"
              rows={2}
              defaultValue={action?.description_detail ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="recommandation">Recommandation</Label>
            <Textarea
              id="recommandation"
              name="recommandation"
              rows={2}
              defaultValue={action?.recommandation ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="indicateurEfficacite">Indicateur d'efficacité</Label>
            <Input
              id="indicateurEfficacite"
              name="indicateurEfficacite"
              defaultValue={action?.indicateur_efficacite ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaires">Commentaires</Label>
            <Textarea
              id="commentaires"
              name="commentaires"
              rows={2}
              defaultValue={action?.commentaires ?? ""}
            />
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'action"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
