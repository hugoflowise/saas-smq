"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setRemonteeAnalyseAction } from "@/lib/actions/registres";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { type AnalyseMethode, champsAnalyse } from "@/lib/remontee-analyse";
import { SELECT_CLASS } from "@/lib/ui-classes";

const METHODES: { value: AnalyseMethode; label: string }[] = [
  { value: "5_pourquoi", label: "5 pourquoi" },
  { value: "arbre_causes", label: "Arbre des causes (5M)" },
  { value: "autre", label: "Autre / libre" },
];

/** Analyse des causes guidée d'une remontée SSE (étape postérieure à la déclaration). */
export function RemonteeAnalyse({
  reclamationId,
  initialMethode,
  initialDetails,
  initialCauses,
}: {
  reclamationId: string;
  initialMethode: AnalyseMethode | null;
  initialDetails: Record<string, string>;
  initialCauses: string;
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [methode, setMethode] = useState<AnalyseMethode | "">(initialMethode ?? "");
  const [details, setDetails] = useState<Record<string, string>>(initialDetails);
  const [causes, setCauses] = useState(initialCauses);
  const [pending, setPending] = useState(false);

  const champs = methode ? champsAnalyse(methode) : [];

  function setChamp(key: string, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setPending(true);
    const r = await setRemonteeAnalyseAction({
      id: reclamationId,
      analyseMethode: methode || undefined,
      // On ne conserve que les champs de la méthode courante.
      analyseDetails: Object.fromEntries(
        champs.map((c) => [c.key, details[c.key] ?? ""]).filter(([, v]) => v !== ""),
      ),
      analyseCauses: causes || undefined,
    });
    setPending(false);
    if (r.ok) {
      toast.success("Analyse enregistrée.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="methode">Méthode d'analyse</Label>
        <select
          id="methode"
          className={SELECT_CLASS}
          value={methode}
          disabled={readOnly}
          onChange={(e) => setMethode(e.target.value as AnalyseMethode | "")}
        >
          <option value="">Choisir une méthode…</option>
          {METHODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {methode === "5_pourquoi" ? (
        <ol className="flex flex-col gap-3">
          {champs.map((c, i) => (
            <li key={c.key} className="flex items-start gap-3">
              <span className="mt-2 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
                {i + 1}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor={c.key} className="text-xs">
                  {c.label}
                </Label>
                <Input
                  id={c.key}
                  value={details[c.key] ?? ""}
                  disabled={readOnly}
                  onChange={(e) => setChamp(c.key, e.target.value)}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {methode === "arbre_causes" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {champs.map((c) => (
            <div key={c.key} className="flex flex-col gap-1">
              <Label htmlFor={c.key} className="text-xs">
                {c.label}
              </Label>
              <Textarea
                id={c.key}
                rows={2}
                value={details[c.key] ?? ""}
                disabled={readOnly}
                placeholder={c.aide}
                onChange={(e) => setChamp(c.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <Label htmlFor="causes" className="text-xs">
          {methode === "autre" ? "Analyse des causes" : "Cause racine retenue / synthèse"}
        </Label>
        <Textarea
          id="causes"
          rows={2}
          value={causes}
          disabled={readOnly}
          onChange={(e) => setCauses(e.target.value)}
          placeholder="Conclusion de l'analyse et cause profonde retenue"
        />
      </div>

      {!readOnly ? (
        <Button onClick={save} disabled={pending} className="self-start">
          {pending ? "Enregistrement…" : "Enregistrer l'analyse"}
        </Button>
      ) : null}
    </div>
  );
}
