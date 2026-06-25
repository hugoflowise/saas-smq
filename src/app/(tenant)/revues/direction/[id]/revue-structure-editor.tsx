"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveRevueStructureAction } from "@/lib/actions/audits-revues";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export type RevueStructureInitial = {
  id: string;
  entreeActionsAnterieures: string;
  entreeEvolutionContexte: string;
  entreePerformanceSynthese: string;
  entreeRessources: string;
  entreeEfficaciteActions: string;
  entreeOpportunites: string;
  sortieAmelioration: string;
  sortieChangements: string;
  sortieRessources: string;
};

const ENTREES: { name: keyof RevueStructureInitial; label: string }[] = [
  { name: "entreeActionsAnterieures", label: "a) Suivi des actions des revues précédentes" },
  { name: "entreeEvolutionContexte", label: "b) Évolutions des enjeux internes et externes" },
  {
    name: "entreePerformanceSynthese",
    label: "c) Synthèse de la performance et de l'efficacité du SMQ",
  },
  { name: "entreeRessources", label: "d) Adéquation des ressources" },
  {
    name: "entreeEfficaciteActions",
    label: "e) Efficacité des actions face aux risques et opportunités",
  },
  { name: "entreeOpportunites", label: "f) Opportunités d'amélioration" },
];

const SORTIES: { name: keyof RevueStructureInitial; label: string }[] = [
  { name: "sortieAmelioration", label: "Décisions et actions d'amélioration" },
  { name: "sortieChangements", label: "Besoins de changement du SMQ" },
  { name: "sortieRessources", label: "Besoins en ressources" },
];

export function RevueStructureEditor({ initial }: { initial: RevueStructureInitial }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    const result = await saveRevueStructureAction({
      id: initial.id,
      entreeActionsAnterieures: f.get("entreeActionsAnterieures") || undefined,
      entreeEvolutionContexte: f.get("entreeEvolutionContexte") || undefined,
      entreePerformanceSynthese: f.get("entreePerformanceSynthese") || undefined,
      entreeRessources: f.get("entreeRessources") || undefined,
      entreeEfficaciteActions: f.get("entreeEfficaciteActions") || undefined,
      entreeOpportunites: f.get("entreeOpportunites") || undefined,
      sortieAmelioration: f.get("sortieAmelioration") || undefined,
      sortieChangements: f.get("sortieChangements") || undefined,
      sortieRessources: f.get("sortieRessources") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Revue enregistrée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  // Lecture seule (auditeur) : affichage sans champ d'édition.
  if (readOnly) {
    return (
      <div className="flex flex-col gap-6">
        <ReadOnlyBloc titre="Éléments d'entrée (§9.3.2)" champs={ENTREES} initial={initial} />
        <ReadOnlyBloc titre="Éléments de sortie (§9.3.3)" champs={SORTIES} initial={initial} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Éléments d'entrée (§9.3.2)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {ENTREES.map((c) => (
            <Champ key={c.name} name={c.name} label={c.label} defaultValue={initial[c.name]} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Éléments de sortie (§9.3.3)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {SORTIES.map((c) => (
            <Champ key={c.name} name={c.name} label={c.label} defaultValue={initial[c.name]} />
          ))}
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la revue"}
        </Button>
      </div>
    </form>
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

function ReadOnlyBloc({
  titre,
  champs,
  initial,
}: {
  titre: string;
  champs: { name: keyof RevueStructureInitial; label: string }[];
  initial: RevueStructureInitial;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titre}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {champs.map((c) => (
          <div key={c.name} className="flex flex-col gap-1">
            <p className="font-medium text-sm">{c.label}</p>
            <p className="whitespace-pre-wrap text-muted-foreground text-sm">
              {initial[c.name] || "—"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
