"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  IndicateurDialog,
  type IndicateurRow,
} from "@/app/(tenant)/indicateurs/create-indicateur-dialog";
import { RoDialog, type RoRow } from "@/app/(tenant)/risques/ro-dialog";
import { SupprimerButton } from "@/components/supprimer-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteIndicateurAction } from "@/lib/actions/indicateurs";
import { saveFicheProcessusAction } from "@/lib/actions/processus-fiche";
import { deleteRoAction } from "@/lib/actions/risques";
import type { FicheUser } from "@/lib/fiche-processus-data";
import { SELECT_CLASS } from "@/lib/ui-classes";

type Activite = { activite: string; responsable: string; documents: string };
type Interaction = { fournisseur: string; nature: string; client: string };

// Champ de ligne (activités, interactions) : démarre à la hauteur d'un Input
// puis s'agrandit tout seul avec le contenu (field-sizing-content sur Textarea).
const LIGNE_CLASS = "min-h-8 resize-none py-1 leading-snug";

export type FicheEditorInitial = {
  id: string;
  nom: string;
  intituleLong: string;
  type: string;
  piloteId: string;
  piloteNom: string;
  dateDerniereRevue: string;
  dateProchaineRevue: string;
  finalite: string;
  perimetre: string;
  referentiels: string;
  entrees: string;
  sorties: string;
  ressourcesHumaines: string;
  ressourcesMaterielles: string;
  ressourcesLogicielles: string;
  ressourcesFinancieres: string;
  ressourcesDocumentaires: string;
  reference: string;
  activites: Activite[];
  interactions: Interaction[];
};

export function FicheEditor({
  initial,
  users,
  indicateurs,
  risques,
  processusOptions,
  onDone,
}: {
  initial: FicheEditorInitial;
  users: FicheUser[];
  indicateurs: IndicateurRow[];
  risques: RoRow[];
  processusOptions: { id: string; nom: string }[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [activites, setActivites] = useState<Activite[]>(initial.activites);
  const [interactions, setInteractions] = useState<Interaction[]>(initial.interactions);
  // Pilote : un utilisateur de l'application, ou « Autre » = personne sans compte
  // (nom saisi librement, sans accès ni e-mail). On démarre sur « Autre » si un
  // nom libre est déjà renseigné.
  const [piloteMode, setPiloteMode] = useState<string>(
    initial.piloteNom.trim() ? "__autre__" : initial.piloteId,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setPending(true);
    // « Autre » → on enregistre un nom libre (sans compte) ; sinon un utilisateur lié.
    const autre = piloteMode === "__autre__";
    const result = await saveFicheProcessusAction({
      id: initial.id,
      nom: f.get("nom"),
      intituleLong: f.get("intituleLong") || undefined,
      type: f.get("type"),
      piloteId: autre ? "" : piloteMode,
      piloteNom: autre ? (f.get("piloteNom") as string) || undefined : undefined,
      dateDerniereRevue: f.get("dateDerniereRevue") || undefined,
      dateProchaineRevue: f.get("dateProchaineRevue") || undefined,
      finalite: f.get("finalite") || undefined,
      perimetre: f.get("perimetre") || undefined,
      referentiels: f.get("referentiels") || undefined,
      entrees: f.get("entrees") || undefined,
      sorties: f.get("sorties") || undefined,
      ressourcesHumaines: f.get("ressourcesHumaines") || undefined,
      ressourcesMaterielles: f.get("ressourcesMaterielles") || undefined,
      ressourcesLogicielles: f.get("ressourcesLogicielles") || undefined,
      ressourcesFinancieres: f.get("ressourcesFinancieres") || undefined,
      ressourcesDocumentaires: f.get("ressourcesDocumentaires") || undefined,
      reference: f.get("reference") || undefined,
      activites: activites.filter((a) => a.activite.trim()),
      interactions: interactions.filter((it) => it.fournisseur.trim() || it.client.trim()),
    });
    setPending(false);
    if (result.ok) {
      toast.success("Fiche enregistrée.");
      router.refresh();
      onDone();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-7 rounded-lg border bg-card p-6 shadow-sm"
      >
        {/* 1. Carte d'identité */}
        <Bloc titre="Carte d'identité du processus">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ
              name="reference"
              label="Référence du document"
              defaultValue={initial.reference}
              ligne
            />
            <Champ
              name="nom"
              label="Nom court (cartographie)"
              hint="affiché dans la cartographie"
              defaultValue={initial.nom}
              ligne
            />
            <Champ
              name="intituleLong"
              label="Intitulé du processus (fiche)"
              hint="ex. « Piloter la stratégie et la gouvernance »"
              defaultValue={initial.intituleLong}
              ligne
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type de processus</Label>
              <select id="type" name="type" className={SELECT_CLASS} defaultValue={initial.type}>
                <option value="pilotage">Pilotage</option>
                <option value="realisation">Réalisation</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="piloteMode">Pilote du processus</Label>
              <select
                id="piloteMode"
                className={SELECT_CLASS}
                value={piloteMode}
                onChange={(e) => setPiloteMode(e.target.value)}
              >
                <option value="">Non défini</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
                <option value="__autre__">Autre — personne sans compte…</option>
              </select>
              {piloteMode === "__autre__" ? (
                <Input
                  name="piloteNom"
                  placeholder="Nom du pilote (ex. Thomas Riou - Président)"
                  defaultValue={initial.piloteNom}
                />
              ) : null}
            </div>
            <Champ
              name="referentiels"
              label="Référentiels applicables"
              defaultValue={initial.referentiels}
            />
            <Champ name="finalite" label="Finalité" defaultValue={initial.finalite} />
            <Champ name="perimetre" label="Périmètre" defaultValue={initial.perimetre} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateDerniereRevue">Dernière revue</Label>
              <Input
                id="dateDerniereRevue"
                name="dateDerniereRevue"
                type="date"
                defaultValue={initial.dateDerniereRevue}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateProchaineRevue">Prochaine revue</Label>
              <Input
                id="dateProchaineRevue"
                name="dateProchaineRevue"
                type="date"
                defaultValue={initial.dateProchaineRevue}
              />
            </div>
          </div>
        </Bloc>

        {/* 2. Données d'entrée et de sortie (alignées côte à côte) */}
        <Bloc titre="Données d'entrée et de sortie">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ
              name="entrees"
              label="Données d'entrée"
              hint="une par ligne"
              defaultValue={initial.entrees}
            />
            <Champ
              name="sorties"
              label="Données de sortie"
              hint="une par ligne"
              defaultValue={initial.sorties}
            />
          </div>
        </Bloc>

        {/* 5. Ressources nécessaires, par type */}
        <Bloc titre="Ressources nécessaires">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ
              name="ressourcesHumaines"
              label="Humaines"
              defaultValue={initial.ressourcesHumaines}
            />
            <Champ
              name="ressourcesMaterielles"
              label="Matérielles"
              defaultValue={initial.ressourcesMaterielles}
            />
            <Champ
              name="ressourcesLogicielles"
              label="Logicielles / SI"
              defaultValue={initial.ressourcesLogicielles}
            />
            <Champ
              name="ressourcesFinancieres"
              label="Financières"
              defaultValue={initial.ressourcesFinancieres}
            />
            <Champ
              name="ressourcesDocumentaires"
              label="Documentaires"
              defaultValue={initial.ressourcesDocumentaires}
            />
          </div>
        </Bloc>

        {/* 4. Description des activités */}
        <Liste
          titre="Description des activités"
          ajout={() =>
            setActivites((a) => [...a, { activite: "", responsable: "", documents: "" }])
          }
        >
          {activites.map((a, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: lignes locales éditables
              key={`act-${i}`}
              className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <Textarea
                rows={1}
                className={LIGNE_CLASS}
                placeholder="Activité"
                value={a.activite}
                onChange={(e) => majActivite(setActivites, i, "activite", e.target.value)}
              />
              <Textarea
                rows={1}
                className={LIGNE_CLASS}
                placeholder="Responsable"
                value={a.responsable}
                onChange={(e) => majActivite(setActivites, i, "responsable", e.target.value)}
              />
              <Textarea
                rows={1}
                className={LIGNE_CLASS}
                placeholder="Documents / outils"
                value={a.documents}
                onChange={(e) => majActivite(setActivites, i, "documents", e.target.value)}
              />
              <SupprBtn onClick={() => setActivites((arr) => arr.filter((_, j) => j !== i))} />
            </div>
          ))}
        </Liste>

        {/* 3. Interactions : 3 colonnes (fournisseur / nature / client) comme la fiche de référence */}
        <Liste
          titre="Interactions avec les autres processus"
          ajout={() => setInteractions((a) => [...a, { fournisseur: "", nature: "", client: "" }])}
        >
          {interactions.length > 0 ? (
            <div className="hidden gap-2 px-1 text-muted-foreground text-xs sm:grid sm:grid-cols-[1fr_1fr_1fr_auto]">
              <span>Processus fournisseur</span>
              <span>Nature de l'interaction</span>
              <span>Processus client</span>
              <span />
            </div>
          ) : null}
          {interactions.map((it, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: lignes locales éditables
              key={`int-${i}`}
              className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <Textarea
                rows={1}
                className={LIGNE_CLASS}
                placeholder="Processus fournisseur"
                value={it.fournisseur}
                onChange={(e) => majInteraction(setInteractions, i, "fournisseur", e.target.value)}
              />
              <Textarea
                rows={1}
                className={LIGNE_CLASS}
                placeholder="Nature de l'interaction"
                value={it.nature}
                onChange={(e) => majInteraction(setInteractions, i, "nature", e.target.value)}
              />
              <Textarea
                rows={1}
                className={LIGNE_CLASS}
                placeholder="Processus client"
                value={it.client}
                onChange={(e) => majInteraction(setInteractions, i, "client", e.target.value)}
              />
              <SupprBtn onClick={() => setInteractions((arr) => arr.filter((_, j) => j !== i))} />
            </div>
          ))}
        </Liste>

        <p className="text-muted-foreground text-xs">
          Rédacteur, vérificateur, approbateur et version se renseignent automatiquement au fil du
          cycle de vie (soumission, approbation, publication).
        </p>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer la fiche"}
          </Button>
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Annuler
          </Button>
        </div>
      </form>

      {/* Indicateurs et R&O : édités directement ici (chaque ajout/modif est
          enregistré immédiatement, indépendamment du bouton « Enregistrer la fiche »). */}
      <div className="flex flex-col gap-7 rounded-lg border bg-card p-6 shadow-sm">
        <SectionLiee
          titre="Indicateurs de performance"
          vide="Aucun indicateur rattaché à ce processus."
          ajout={
            <IndicateurDialog processusOptions={processusOptions} presetProcessusId={initial.id} />
          }
        >
          {indicateurs.map((ind) => (
            <li key={ind.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate font-medium text-sm">{ind.nom}</span>
              <div className="flex shrink-0 items-center gap-1">
                <IndicateurDialog indicateur={ind} processusOptions={processusOptions} />
                <SupprimerButton
                  action={deleteIndicateurAction}
                  id={ind.id}
                  libelle="cet indicateur"
                  successText="Indicateur supprimé."
                  iconOnly
                />
              </div>
            </li>
          ))}
        </SectionLiee>

        <SectionLiee
          titre="Risques et opportunités"
          vide="Aucun risque ni opportunité rattaché à ce processus."
          ajout={<RoDialog processusOptions={processusOptions} presetProcessusId={initial.id} />}
        >
          {risques.map((ro) => (
            <li key={ro.id} className="flex items-center justify-between gap-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-xs ${
                    ro.type === "opportunite"
                      ? "bg-status-conforme/15 text-status-conforme"
                      : "bg-status-nc-mineure/15 text-status-nc-mineure"
                  }`}
                >
                  {ro.type === "opportunite" ? "Opportunité" : "Risque"}
                </span>
                <span className="min-w-0 truncate font-medium text-sm">{ro.intitule}</span>
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <RoDialog ro={ro} processusOptions={processusOptions} />
                <SupprimerButton
                  action={deleteRoAction}
                  id={ro.id}
                  libelle="cet élément"
                  successText="Élément supprimé."
                  iconOnly
                />
              </div>
            </li>
          ))}
        </SectionLiee>
      </div>
    </div>
  );
}

/**
 * Section d'éléments liés (indicateurs, R&O) éditables en direct depuis la fiche.
 * En-tête avec titre + déclencheur d'ajout (dialogue), puis liste ou message vide.
 */
function SectionLiee({
  titre,
  vide,
  ajout,
  children,
}: {
  titre: string;
  vide: string;
  ajout: React.ReactNode;
  children: React.ReactNode;
}) {
  const isEmpty = Array.isArray(children) && children.length === 0;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b pb-1.5">
        <h3 className="font-semibold text-sm">{titre}</h3>
        {ajout}
      </div>
      {isEmpty ? (
        <p className="text-muted-foreground text-sm">{vide}</p>
      ) : (
        <ul className="flex flex-col divide-y">{children}</ul>
      )}
    </section>
  );
}

/** Groupe de champs avec titre de section, homogène sur toute la fiche. */
function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="border-b pb-1.5 font-semibold text-sm">{titre}</h3>
      {children}
    </section>
  );
}

function Champ({
  name,
  label,
  defaultValue,
  hint,
  ligne,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
  ligne?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>
        {label}
        {hint ? (
          <span className="ml-1 font-normal text-muted-foreground text-xs">({hint})</span>
        ) : null}
      </Label>
      {ligne ? (
        <Input id={name} name={name} defaultValue={defaultValue} />
      ) : (
        <Textarea id={name} name={name} rows={3} defaultValue={defaultValue} />
      )}
    </div>
  );
}

function Liste({
  titre,
  ajout,
  children,
}: {
  titre: string;
  ajout: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b pb-1.5">
        <h3 className="font-semibold text-sm">{titre}</h3>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={ajout}>
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function SupprBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} aria-label="Supprimer">
      <Trash2 className="size-4 text-status-nc-mineure" />
    </Button>
  );
}

function majActivite(
  set: React.Dispatch<React.SetStateAction<Activite[]>>,
  index: number,
  key: keyof Activite,
  value: string,
) {
  set((arr) => arr.map((a, j) => (j === index ? { ...a, [key]: value } : a)));
}

function majInteraction(
  set: React.Dispatch<React.SetStateAction<Interaction[]>>,
  index: number,
  key: keyof Interaction,
  value: string,
) {
  set((arr) => arr.map((it, j) => (j === index ? { ...it, [key]: value } : it)));
}
