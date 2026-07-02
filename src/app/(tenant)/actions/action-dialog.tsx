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
import { createActionAction, updateActionAction } from "@/lib/actions/plan-actions";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import {
  ACTION_ORIGINE_LABELS,
  ACTION_PRIORITE_LABELS,
  ACTION_STATUT_LABELS,
  ACTION_TYPE_LABELS,
  COTATION_OPTIONS,
  NC_GRAVITE_LABELS,
  NC_ORIGINE_LABELS,
  NC_TYPE_LABELS,
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
  resultat_efficacite: string | null;
  date_verification_efficacite: string | null;
  resultat_verification: string | null;
  commentaires: string | null;
  constat?: string | null;
  cause_fondamentale?: string | null;
  recommandation?: string | null;
  cotation?: string | null;
  objectif_id?: string | null;
};

type Props = {
  processusOptions: { id: string; nom: string }[];
  /** Objectifs qualité du client (lien §6.2.2). */
  objectifOptions?: { id: string; intitule: string }[];
  /** Objectif présélectionné (création d'une action depuis un objectif). */
  presetObjectifId?: string;
  action?: ActionRow;
  /**
   * Déclencheur personnalisé (ex. nom de la ligne cliquable dans la liste).
   * Si absent, on retombe sur le bouton « Nouvelle action » (création) ou
   * l'icône crayon (édition).
   */
  trigger?: React.ReactElement;
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

export function ActionDialog({
  processusOptions,
  objectifOptions = [],
  presetObjectifId,
  action,
  trigger,
}: Props) {
  const isEdit = Boolean(action);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();
  // À la création : la case « créer une NC liée » révèle les champs de la NC.
  const [creerNc, setCreerNc] = useState(false);

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
          objectifId: form.get("objectifId") || undefined,
          datePrevue: form.get("datePrevue") || undefined,
          indicateurEfficacite: form.get("indicateurEfficacite") || undefined,
          resultatEfficacite: form.get("resultatEfficacite") || undefined,
          dateVerificationEfficacite: form.get("dateVerificationEfficacite") || undefined,
          resultatVerification: form.get("resultatVerification") || undefined,
          commentaires: form.get("commentaires") || undefined,
          cotation: form.get("cotation") || undefined,
          constat: form.get("constat") || undefined,
          causeFondamentale: form.get("causeFondamentale") || undefined,
          recommandation: form.get("recommandation") || undefined,
        };
        if (isEdit) return updateActionAction({ id: action?.id, ...payload });
        const withNc = form.get("creerNc") === "on";
        return createActionAction({
          ...payload,
          creerNc: withNc,
          nc: withNc
            ? {
                gravite: form.get("ncGravite") || undefined,
                type: form.get("ncType") || undefined,
                origine: form.get("ncOrigine") || undefined,
              }
            : undefined,
        });
      },
      success: isEdit ? "Action mise à jour." : "Action créée.",
    });
  }

  // Lecture seule (auditeur) : pas d'écriture. En édition, si un trigger
  // personnalisé est fourni (nom de la ligne), on l'affiche tel quel sans
  // ouvrir le dialogue ; sinon on masque le bouton « Nouvelle action » / crayon.
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
                {/* État initial « non coté » : affichable mais discret, pas un vrai choix. */}
                <option value="non_evalue">Non évalué</option>
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
              <Label htmlFor="objectifId">Objectif lié</Label>
              <select
                id="objectifId"
                name="objectifId"
                className={SELECT_CLASS}
                defaultValue={action?.objectif_id ?? presetObjectifId ?? ""}
              >
                <option value="">Aucun</option>
                {objectifOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.intitule}
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
          {/* §10.2 - vérification de l'efficacité : quand + résultat probant.
              Requis pour pouvoir clôturer une NC liée avec un verdict. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[max-content_1fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateVerificationEfficacite">Date de vérification d'efficacité</Label>
              <Input
                id="dateVerificationEfficacite"
                name="dateVerificationEfficacite"
                type="date"
                defaultValue={action?.date_verification_efficacite ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="resultatVerification">Résultat de la vérification</Label>
              <Textarea
                id="resultatVerification"
                name="resultatVerification"
                rows={2}
                defaultValue={action?.resultat_verification ?? ""}
                placeholder="Constat probant : l'action est-elle efficace ? preuve à l'appui…"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="resultatEfficacite">
              Résultats mesurés / Efficacité de l'action corrective
            </Label>
            <Textarea
              id="resultatEfficacite"
              name="resultatEfficacite"
              rows={2}
              defaultValue={action?.resultat_efficacite ?? ""}
              placeholder="Résultat mesuré après mise en œuvre et conclusion sur l'efficacité…"
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

          {/* Création uniquement : ouvrir en même temps une non-conformité liée
              (miroir de la case « créer une action » du formulaire de NC). */}
          {!isEdit ? (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
              <label className="flex items-center gap-2 font-medium text-sm">
                <input
                  type="checkbox"
                  name="creerNc"
                  className="size-4"
                  checked={creerNc}
                  onChange={(e) => setCreerNc(e.target.checked)}
                />
                Créer une non-conformité liée à cette action
              </label>
              {creerNc ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ncGravite">Gravité</Label>
                    <select
                      id="ncGravite"
                      name="ncGravite"
                      className={SELECT_CLASS}
                      defaultValue="mineure"
                    >
                      <Options map={NC_GRAVITE_LABELS} />
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ncType">Type</Label>
                    <select
                      id="ncType"
                      name="ncType"
                      className={SELECT_CLASS}
                      defaultValue="nc_processus"
                    >
                      <Options map={NC_TYPE_LABELS} />
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ncOrigine">Origine</Label>
                    <select
                      id="ncOrigine"
                      name="ncOrigine"
                      className={SELECT_CLASS}
                      defaultValue="autre"
                    >
                      <Options map={NC_ORIGINE_LABELS} />
                    </select>
                  </div>
                  <p className="text-muted-foreground text-xs sm:col-span-3">
                    La non-conformité reprend l'intitulé, le constat et le processus de l'action, et
                    démarre au statut « Action définie ».
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'action"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
