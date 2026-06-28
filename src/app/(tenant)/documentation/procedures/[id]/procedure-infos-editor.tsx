"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProcedureInfosAction } from "@/lib/actions/procedures";

type Ref = { numero: string; reference: string; designation: string };
type Def = { terme: string; definition: string };

export type ProcInfosInitial = {
  id: string;
  objet: string;
  domaineApplication: string;
  resume: string;
  diffusion: string;
  glossaireSigles: string;
  glossaireSymboles: string;
  glossaireAbreviations: string;
  definitions: Def[];
  referencesDoc: Ref[];
};

export function ProcedureInfosEditor({ initial }: { initial: ProcInfosInitial }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [refsDoc, setRefsDoc] = useState<Ref[]>(initial.referencesDoc);
  const [definitions, setDefinitions] = useState<Def[]>(initial.definitions);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    const result = await saveProcedureInfosAction({
      id: initial.id,
      objet: f.get("objet") || undefined,
      domaineApplication: f.get("domaineApplication") || undefined,
      resume: f.get("resume") || undefined,
      diffusion: f.get("diffusion") || undefined,
      glossaireSigles: f.get("glossaireSigles") || undefined,
      glossaireSymboles: f.get("glossaireSymboles") || undefined,
      glossaireAbreviations: f.get("glossaireAbreviations") || undefined,
      definitions: definitions.filter((d) => d.terme.trim() || d.definition.trim()),
      referencesDoc: refsDoc.filter((r) => r.reference.trim() || r.designation.trim()),
    });
    setPending(false);
    if (result.ok) {
      toast.success("Informations enregistrées.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-lg border bg-card p-6 shadow-sm"
    >
      <h3 className="font-semibold text-sm">Informations de la procédure</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Champ name="resume" label="Résumé" defaultValue={initial.resume} />
        <Champ name="diffusion" label="Diffusion" defaultValue={initial.diffusion} />
        <Champ name="objet" label="Objet" defaultValue={initial.objet} />
        <Champ
          name="domaineApplication"
          label="Domaine d'application"
          defaultValue={initial.domaineApplication}
        />
      </div>

      <RefsListe titre="Documents de référence" refs={refsDoc} set={setRefsDoc} />

      <Bloc titre="Glossaire (une entrée par ligne)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Champ name="glossaireSigles" label="Sigles" defaultValue={initial.glossaireSigles} />
          <Champ
            name="glossaireSymboles"
            label="Symboles"
            defaultValue={initial.glossaireSymboles}
          />
          <Champ
            name="glossaireAbreviations"
            label="Abréviations"
            defaultValue={initial.glossaireAbreviations}
          />
        </div>
      </Bloc>

      <Liste
        titre="Définitions"
        ajout={() => setDefinitions((a) => [...a, { terme: "", definition: "" }])}
      >
        {definitions.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lignes locales éditables
          <div key={`def-${i}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input
              placeholder="Terme"
              value={d.terme}
              onChange={(e) => maj(setDefinitions, i, "terme", e.target.value)}
            />
            <Input
              placeholder="Définition"
              value={d.definition}
              onChange={(e) => maj(setDefinitions, i, "definition", e.target.value)}
            />
            <SupprBtn onClick={() => setDefinitions((arr) => arr.filter((_, j) => j !== i))} />
          </div>
        ))}
      </Liste>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les informations"}
        </Button>
      </div>
    </form>
  );
}

function RefsListe({
  titre,
  refs,
  set,
}: {
  titre: string;
  refs: Ref[];
  set: React.Dispatch<React.SetStateAction<Ref[]>>;
}) {
  return (
    <Liste
      titre={titre}
      ajout={() => set((a) => [...a, { numero: "", reference: "", designation: "" }])}
    >
      {refs.map((r, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lignes locales éditables
        <div key={`ref-${i}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[80px_1fr_2fr_auto]">
          <Input
            placeholder="N°"
            value={r.numero}
            onChange={(e) => maj(set, i, "numero", e.target.value)}
          />
          <Input
            placeholder="Référence"
            value={r.reference}
            onChange={(e) => maj(set, i, "reference", e.target.value)}
          />
          <Input
            placeholder="Désignation du document"
            value={r.designation}
            onChange={(e) => maj(set, i, "designation", e.target.value)}
          />
          <SupprBtn onClick={() => set((arr) => arr.filter((_, j) => j !== i))} />
        </div>
      ))}
    </Liste>
  );
}

function Champ({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={3} defaultValue={defaultValue} />
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="border-b pb-1.5 font-medium text-sm">{titre}</h4>
      {children}
    </section>
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
        <h4 className="font-medium text-sm">{titre}</h4>
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

function maj<T>(
  set: React.Dispatch<React.SetStateAction<T[]>>,
  index: number,
  key: keyof T,
  value: string,
) {
  set((arr) => arr.map((item, j) => (j === index ? { ...item, [key]: value } : item)));
}
