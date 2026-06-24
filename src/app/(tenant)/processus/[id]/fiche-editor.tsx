"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveFicheProcessusAction } from "@/lib/actions/processus-fiche";
import { SELECT_CLASS } from "@/lib/ui-classes";

type Activite = { activite: string; responsable: string; documents: string };
type Interaction = { sens: "entrant" | "sortant"; partenaire: string; nature: string };

export type FicheEditorInitial = {
  id: string;
  finalite: string;
  perimetre: string;
  referentiels: string;
  entrees: string;
  sorties: string;
  ressources: string;
  ficheRedacteur: string;
  ficheVerificateur: string;
  ficheVersion: string;
  ficheNoteRevision: string;
  activites: Activite[];
  interactions: Interaction[];
};

export function FicheEditor({
  initial,
  onDone,
}: {
  initial: FicheEditorInitial;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [activites, setActivites] = useState<Activite[]>(initial.activites);
  const [interactions, setInteractions] = useState<Interaction[]>(initial.interactions);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setPending(true);
    const result = await saveFicheProcessusAction({
      id: initial.id,
      finalite: f.get("finalite") || undefined,
      perimetre: f.get("perimetre") || undefined,
      referentiels: f.get("referentiels") || undefined,
      entrees: f.get("entrees") || undefined,
      sorties: f.get("sorties") || undefined,
      ressources: f.get("ressources") || undefined,
      ficheRedacteur: f.get("ficheRedacteur") || undefined,
      ficheVerificateur: f.get("ficheVerificateur") || undefined,
      ficheVersion: f.get("ficheVersion") || undefined,
      ficheNoteRevision: f.get("ficheNoteRevision") || undefined,
      activites: activites.filter((a) => a.activite.trim()),
      interactions: interactions.filter((it) => it.partenaire.trim()),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Champ name="finalite" label="Finalité" defaultValue={initial.finalite} />
        <Champ name="perimetre" label="Périmètre" defaultValue={initial.perimetre} />
        <Champ
          name="referentiels"
          label="Référentiels applicables"
          defaultValue={initial.referentiels}
        />
        <Champ
          name="entrees"
          label="Données d'entrée (une par ligne)"
          defaultValue={initial.entrees}
        />
        <Champ
          name="sorties"
          label="Données de sortie (une par ligne)"
          defaultValue={initial.sorties}
        />
        <Champ
          name="ressources"
          label="Ressources (une par ligne)"
          defaultValue={initial.ressources}
        />
      </div>

      {/* Activités */}
      <Liste
        titre="Description des activités"
        ajout={() => setActivites((a) => [...a, { activite: "", responsable: "", documents: "" }])}
      >
        {activites.map((a, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lignes locales éditables
          <div key={`act-${i}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              placeholder="Activité"
              value={a.activite}
              onChange={(e) => majActivite(setActivites, i, "activite", e.target.value)}
            />
            <Input
              placeholder="Responsable"
              value={a.responsable}
              onChange={(e) => majActivite(setActivites, i, "responsable", e.target.value)}
            />
            <Input
              placeholder="Documents / outils"
              value={a.documents}
              onChange={(e) => majActivite(setActivites, i, "documents", e.target.value)}
            />
            <SupprBtn onClick={() => setActivites((arr) => arr.filter((_, j) => j !== i))} />
          </div>
        ))}
      </Liste>

      {/* Interactions */}
      <Liste
        titre="Interactions avec les autres processus"
        ajout={() =>
          setInteractions((a) => [...a, { sens: "entrant", partenaire: "", nature: "" }])
        }
      >
        {interactions.map((it, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lignes locales éditables
          <div key={`int-${i}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
            <select
              className={SELECT_CLASS}
              value={it.sens}
              onChange={(e) => majInteraction(setInteractions, i, "sens", e.target.value)}
            >
              <option value="entrant">Entrant (fournisseur)</option>
              <option value="sortant">Sortant (client)</option>
            </select>
            <Input
              placeholder="Processus / entité"
              value={it.partenaire}
              onChange={(e) => majInteraction(setInteractions, i, "partenaire", e.target.value)}
            />
            <Input
              placeholder="Nature de l'interaction"
              value={it.nature}
              onChange={(e) => majInteraction(setInteractions, i, "nature", e.target.value)}
            />
            <SupprBtn onClick={() => setInteractions((arr) => arr.filter((_, j) => j !== i))} />
          </div>
        ))}
      </Liste>

      {/* Validation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Champ
          name="ficheRedacteur"
          label="Rédigé par"
          defaultValue={initial.ficheRedacteur}
          mono
        />
        <Champ
          name="ficheVerificateur"
          label="Vérifié par"
          defaultValue={initial.ficheVerificateur}
          mono
        />
        <Champ name="ficheVersion" label="Version" defaultValue={initial.ficheVersion} mono />
        <Champ
          name="ficheNoteRevision"
          label="Nature de la révision"
          defaultValue={initial.ficheNoteRevision}
          mono
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la fiche"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function Champ({
  name,
  label,
  defaultValue,
  mono,
}: {
  name: string;
  label: string;
  defaultValue: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      {mono ? (
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{titre}</p>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={ajout}>
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
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
