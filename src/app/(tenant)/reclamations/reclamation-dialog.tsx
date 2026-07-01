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
import { createReclamationAction, updateReclamationAction } from "@/lib/actions/registres";
import { DOMAINE_SSE_LABELS, DOMAINES_SSE } from "@/lib/domaines-sse";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import {
  ACTION_PRIORITE_LABELS,
  ACTION_TYPE_LABELS,
  REMONTEE_ANALYSE_LABELS,
  REMONTEE_TYPE_LABELS,
  REMONTEE_TYPES_QUALITE,
  REMONTEE_TYPES_SSE,
} from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type ReclamationRow = {
  id: string;
  type: string;
  objet: string;
  client: string | null;
  date_reception: string;
  canal: string;
  gravite: string;
  description: string | null;
  traitement: string | null;
  statut: string;
  domaine?: string | null;
  analyse_methode?: string | null;
  analyse_causes?: string | null;
};

export function ReclamationDialog({
  reclamation,
  trigger,
  processusOptions = [],
  afficherSse = false,
}: {
  reclamation?: ReclamationRow;
  trigger?: React.ReactElement;
  processusOptions?: { id: string; nom: string }[];
  /** Affiche les types + champs santé-sécurité-environnement (MASE Axe 4). */
  afficherSse?: boolean;
}) {
  const isEdit = Boolean(reclamation);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();
  // À la création : la case « créer une action » révèle les champs de l'action.
  const [creerAction, setCreerAction] = useState(true);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          type: f.get("type"),
          objet: f.get("objet"),
          client: f.get("client") || undefined,
          dateReception: f.get("dateReception") || undefined,
          canal: f.get("canal"),
          gravite: f.get("gravite"),
          description: f.get("description") || undefined,
          traitement: f.get("traitement") || undefined,
          statut: f.get("statut"),
          domaine: f.get("domaine") || undefined,
          analyseMethode: f.get("analyseMethode") || undefined,
          analyseCauses: f.get("analyseCauses") || undefined,
        };
        if (isEdit) return updateReclamationAction({ id: reclamation?.id, ...data });
        const withAction = f.get("creerAction") === "on";
        return createReclamationAction({
          ...data,
          creerAction: withAction,
          action: withAction
            ? {
                descriptionCourte: f.get("actionDescriptionCourte") || undefined,
                descriptionDetail: f.get("actionDescriptionDetail") || undefined,
                type: f.get("actionType") || undefined,
                priorite: f.get("actionPriorite") || undefined,
                datePrevue: f.get("actionDatePrevue") || undefined,
                processusConcerne: f.get("actionProcessus") || undefined,
              }
            : undefined,
        });
      },
      success: isEdit ? "Remontée mise à jour." : "Remontée enregistrée.",
    });
  }

  // Types proposés selon la norme ; on garde le type courant s'il n'est pas listé
  // (ex. remontée SSE ouverte puis client repassé en qualité seule).
  const typesBase = afficherSse ? REMONTEE_TYPES_SSE : REMONTEE_TYPES_QUALITE;
  const typeCourant = reclamation?.type;
  const typeOptions: string[] = [
    ...typesBase,
    ...(typeCourant && !typesBase.includes(typeCourant as never) ? [typeCourant] : []),
  ];

  // Lecture seule (auditeur) : en édition on garde le trigger fourni (libellé de
  // ligne) mais inerte ; le crayon par défaut est masqué. En création on masque tout.
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
            <Button>Nouvelle remontée</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la remontée" : "Nouvelle remontée"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type de remontée</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={reclamation?.type ?? typeOptions[0]}
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {REMONTEE_TYPE_LABELS[t as keyof typeof REMONTEE_TYPE_LABELS] ?? t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="objet">Objet</Label>
              <Input id="objet" name="objet" required defaultValue={reclamation?.objet ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" name="client" defaultValue={reclamation?.client ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateReception">Date de réception</Label>
              <Input
                id="dateReception"
                name="dateReception"
                type="date"
                defaultValue={reclamation?.date_reception ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="canal">Canal</Label>
              <select
                id="canal"
                name="canal"
                className={SELECT_CLASS}
                defaultValue={reclamation?.canal ?? "mail"}
              >
                <option value="mail">E-mail</option>
                <option value="tel">Téléphone</option>
                <option value="visio">Visio</option>
                <option value="audit">Audit</option>
                <option value="enquete">Enquête</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gravite">Gravité</Label>
              <select
                id="gravite"
                name="gravite"
                className={SELECT_CLASS}
                defaultValue={reclamation?.gravite ?? "mineure"}
              >
                <option value="mineure">Mineure</option>
                <option value="majeure">Majeure</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            {afficherSse ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="domaine">Domaine SSE</Label>
                <select
                  id="domaine"
                  name="domaine"
                  className={SELECT_CLASS}
                  defaultValue={reclamation?.domaine ?? ""}
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
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={reclamation?.statut ?? "recue"}
              >
                <option value="recue">Reçue</option>
                <option value="analysee">Analysée</option>
                <option value="traitee">Traitée</option>
                <option value="cloturee">Clôturée</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={reclamation?.description ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="traitement">Traitement / réponse</Label>
            <Textarea
              id="traitement"
              name="traitement"
              rows={2}
              defaultValue={reclamation?.traitement ?? ""}
            />
          </div>
          {afficherSse ? (
            <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-[200px_1fr]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="analyseMethode">Méthode d'analyse</Label>
                <select
                  id="analyseMethode"
                  name="analyseMethode"
                  className={SELECT_CLASS}
                  defaultValue={reclamation?.analyse_methode ?? ""}
                >
                  <option value="">-</option>
                  {Object.entries(REMONTEE_ANALYSE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="analyseCauses">Analyse des causes</Label>
                <Textarea
                  id="analyseCauses"
                  name="analyseCauses"
                  rows={2}
                  defaultValue={reclamation?.analyse_causes ?? ""}
                  placeholder="Causes profondes (5 pourquoi, arbre des causes…)"
                />
              </div>
            </div>
          ) : null}
          {!isEdit ? (
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="creerAction"
                  checked={creerAction}
                  onChange={(e) => setCreerAction(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                Créer une action liée dans le plan d'actions
              </label>
              {creerAction ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="actionDescriptionCourte">Intitulé de l'action</Label>
                    <Input
                      id="actionDescriptionCourte"
                      name="actionDescriptionCourte"
                      placeholder="Repris de l'objet de la remontée si laissé vide"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="actionType">Type d'action</Label>
                      <select
                        id="actionType"
                        name="actionType"
                        className={SELECT_CLASS}
                        defaultValue="corrective"
                      >
                        {Object.entries(ACTION_TYPE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="actionPriorite">Priorité</Label>
                      <select
                        id="actionPriorite"
                        name="actionPriorite"
                        className={SELECT_CLASS}
                        defaultValue=""
                      >
                        <option value="">Selon la gravité</option>
                        {Object.entries(ACTION_PRIORITE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="actionDatePrevue">Échéance</Label>
                      <Input id="actionDatePrevue" name="actionDatePrevue" type="date" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="actionProcessus">Processus concerné</Label>
                      <select
                        id="actionProcessus"
                        name="actionProcessus"
                        className={SELECT_CLASS}
                        defaultValue=""
                      >
                        <option value="">-</option>
                        {processusOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="actionDescriptionDetail">Détail / action à mener</Label>
                    <Textarea
                      id="actionDescriptionDetail"
                      name="actionDescriptionDetail"
                      rows={2}
                      placeholder="Reprend la description de la remontée si laissé vide"
                    />
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
