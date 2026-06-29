"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveDomaineAction } from "@/lib/actions/domaine";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export type Exclusion = { clause: string; intitule: string; justification: string };

type Initial = {
  perimetre: string;
  sites: string;
  exclusions: Exclusion[];
  dateEtablissement: string;
  prochaineRevue: string;
};

// Exclusions fréquentes pour une activité de service (à valider par le client).
const EXCLUSIONS_TYPES: Exclusion[] = [
  { clause: "8.3", intitule: "Conception et développement", justification: "" },
  { clause: "7.1.5", intitule: "Ressources de surveillance et de mesure", justification: "" },
  { clause: "8.6", intitule: "Libération des produits et services", justification: "" },
];

export function DomaineForm({ initial }: { exists: boolean; initial: Initial }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [perimetre, setPerimetre] = useState(initial.perimetre);
  const [sites, setSites] = useState(initial.sites);
  const [exclusions, setExclusions] = useState<Exclusion[]>(initial.exclusions);
  const [dateEtablissement, setDateEtablissement] = useState(initial.dateEtablissement);
  const [prochaineRevue, setProchaineRevue] = useState(initial.prochaineRevue);
  const [pending, setPending] = useState(false);

  const setExcl = (i: number, key: keyof Exclusion, value: string) =>
    setExclusions((arr) => arr.map((e, j) => (j === i ? { ...e, [key]: value } : e)));

  async function save() {
    setPending(true);
    const result = await saveDomaineAction({
      perimetre,
      sites,
      exclusions: exclusions.filter(
        (e) => e.clause.trim() || e.intitule.trim() || e.justification.trim(),
      ),
      dateEtablissement,
      prochaineRevue,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Domaine d'application enregistré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Périmètre du SMQ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="perimetre">Énoncé du domaine d'application</Label>
            <p className="text-muted-foreground text-xs">
              Activités, produits et services couverts par le SMQ.
            </p>
            <Textarea
              id="perimetre"
              rows={4}
              value={perimetre}
              placeholder="Ex. : prestations de conseil et d'audit en management de la qualité pour les secteurs industriels et tertiaires."
              onChange={(e) => setPerimetre(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sites">Sites et implantations concernés</Label>
            <Textarea
              id="sites"
              rows={2}
              value={sites}
              placeholder="Ex. : siège social de Lyon et interventions sur sites clients en France."
              onChange={(e) => setSites(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Exigences non applicables (exclusions)</CardTitle>
            <p className="mt-1 text-muted-foreground text-xs">
              Toute exclusion doit être justifiée et ne pas affecter la conformité des prestations.
            </p>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              {exclusions.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExclusions(EXCLUSIONS_TYPES.map((e) => ({ ...e })))}
                >
                  Proposer les exclusions types (service)
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  setExclusions((a) => [...a, { clause: "", intitule: "", justification: "" }])
                }
              >
                <Plus className="size-3.5" />
                Ajouter
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {exclusions.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-3 text-muted-foreground text-sm">
              Aucune exclusion. Pour une activité de service, les §8.3 (conception), §7.1.5
              (métrologie) et §8.6 (libération) sont fréquemment exclus.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {exclusions.map((e, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: lignes locales éditables
                <div key={i} className="rounded-lg border bg-muted/30 p-3">
                  <div className="grid grid-cols-[90px_1fr_auto] gap-2">
                    <Input
                      placeholder="§"
                      value={e.clause}
                      onChange={(ev) => setExcl(i, "clause", ev.target.value)}
                      disabled={readOnly}
                    />
                    <Input
                      placeholder="Intitulé de l'exigence"
                      value={e.intitule}
                      onChange={(ev) => setExcl(i, "intitule", ev.target.value)}
                      disabled={readOnly}
                    />
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer l'exclusion"
                        onClick={() => setExclusions((arr) => arr.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="size-4 text-status-nc-mineure" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    className="mt-2 bg-card"
                    rows={2}
                    placeholder="Justification de l'exclusion"
                    value={e.justification}
                    onChange={(ev) => setExcl(i, "justification", ev.target.value)}
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Établissement & revue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateEtablissement">Date d'établissement</Label>
            <Input
              id="dateEtablissement"
              type="date"
              className="w-44"
              value={dateEtablissement}
              onChange={(e) => setDateEtablissement(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prochaineRevue">Prochaine revue</Label>
            <Input
              id="prochaineRevue"
              type="date"
              className="w-44"
              value={prochaineRevue}
              onChange={(e) => setProchaineRevue(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Barre d'actions : l'approbation officielle se fait via « Publier une version ». */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}
