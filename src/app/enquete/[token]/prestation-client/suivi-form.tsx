"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSuiviPrestationAction } from "@/lib/actions/suivi-prestation";
import type { Champ, SectionConfig } from "@/lib/suivi-consultant";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-border border-t pt-6 first:border-t-0 first:pt-0">
      <h2 className="font-semibold text-base">
        <span className="text-muted-foreground">{n}.</span> {title}
      </h2>
      {children}
    </section>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Label>
      {label} {required ? <span className="text-status-nc-mineure">*</span> : null}
    </Label>
  );
}

function Scale({
  value,
  onChange,
  min,
  max,
}: {
  value: number | null;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`size-9 rounded-lg border font-medium text-sm transition-colors ${
            value === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/** Grille « matrice » : chaque ligne notée sur une même échelle de boutons. */
function Matrice({
  champ,
  values,
  onChange,
}: {
  champ: Champ;
  values: Record<string, number>;
  onChange: (ligneKey: string, n: number) => void;
}) {
  const min = champ.echelle?.min ?? 1;
  const max = champ.echelle?.max ?? 4;
  const labels = champ.echelle?.labels ?? {};
  const notes = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <div className="flex flex-col gap-3">
      {champ.label ? <p className="text-muted-foreground text-sm">{champ.label}</p> : null}
      <div className="flex flex-col gap-3">
        {(champ.lignes ?? []).map((ligne) => (
          <div key={ligne.key} className="flex flex-col gap-1.5">
            <span className="text-sm">
              {ligne.label}{" "}
              {champ.required ? <span className="text-status-nc-mineure">*</span> : null}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {notes.map((n) => (
                <button
                  key={n}
                  type="button"
                  title={labels[n]}
                  onClick={() => onChange(ligne.key, n)}
                  className={`h-9 rounded-lg border px-3 font-medium text-sm transition-colors ${
                    values[ligne.key] === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuiviForm({
  token,
  nomSociete,
  sections,
  modeleVersion,
}: {
  token: string;
  nomSociete: string;
  sections: SectionConfig[];
  modeleVersion: number | null;
}) {
  const [singles, setSingles] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [matrices, setMatrices] = useState<Record<string, Record<string, number>>>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = (c: Champ) => !c.showIf || singles[c.showIf.key] === c.showIf.equals;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const reponses: Record<string, unknown> = {};

    for (const section of sections) {
      for (const c of section.champs) {
        if (!visible(c)) continue;
        if (c.type === "single") {
          reponses[c.key] = singles[c.key] ?? "";
        } else if (c.type === "note5" || c.type === "nps") {
          reponses[c.key] = notes[c.key] ?? null;
        } else if (c.type === "matrice") {
          reponses[c.key] = matrices[c.key] ?? {};
        } else if (c.type === "multi") {
          reponses[c.key] = f.getAll(c.key).map(String);
          if (c.allowAutre) reponses[`${c.key}_autre`] = (f.get(`${c.key}_autre`) as string) || "";
        } else {
          reponses[c.key] = (f.get(c.key) as string) || "";
        }
      }
    }

    // Validation des champs requis non gérés nativement (multi, notes, matrice).
    for (const section of sections) {
      for (const c of section.champs) {
        if (!c.required || !visible(c)) continue;
        if (c.type === "multi" && (reponses[c.key] as string[]).length === 0) {
          setError(`Merci de répondre : « ${c.label} » (section ${section.n}).`);
          return;
        }
        if ((c.type === "note5" || c.type === "nps") && reponses[c.key] == null) {
          setError(`Merci de répondre : « ${c.label} » (section ${section.n}).`);
          return;
        }
        if (c.type === "matrice") {
          const vals = (reponses[c.key] ?? {}) as Record<string, number>;
          if ((c.lignes ?? []).some((l) => vals[l.key] == null)) {
            setError(`Merci de noter chaque ligne (section ${section.n}).`);
            return;
          }
        }
      }
    }

    setError(null);
    setPending(true);
    const result = await submitSuiviPrestationAction({
      token,
      reponses,
      modeleVersion,
      attestation: f.get("attestation") === "on",
    });
    setPending(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-status-conforme/15 text-2xl text-status-conforme">
          ✓
        </div>
        <h2 className="font-semibold text-lg">Compte rendu enregistré</h2>
        <p className="text-muted-foreground text-sm">
          Merci, le suivi de prestation a bien été transmis.
        </p>
      </div>
    );
  }

  // La section « Validation » reçoit la case d'attestation sur l'honneur (hors modèle).
  const derniereSectionN = sections[sections.length - 1]?.n;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {sections.map((section) => (
        <Section key={section.n} n={section.n} title={section.title}>
          {section.n === derniereSectionN ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="attestation"
                required
                className="mt-0.5 size-4 shrink-0"
              />
              Je certifie sur l'honneur l'exactitude des renseignements de ce compte rendu, rédigé
              avec le client.
            </label>
          ) : null}
          {section.champs.filter(visible).map((c) => (
            <div key={c.key} className="flex flex-col gap-1.5">
              {c.type !== "matrice" ? <FieldLabel label={c.label} required={c.required} /> : null}
              {c.type === "text" || c.type === "email" ? (
                <Input
                  name={c.key}
                  type={c.type === "email" ? "email" : "text"}
                  required={c.required}
                />
              ) : null}
              {c.type === "date" ? <Input name={c.key} type="date" required={c.required} /> : null}
              {c.type === "textarea" ? (
                <Textarea name={c.key} rows={3} required={c.required} />
              ) : null}
              {c.type === "single" ? (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {(c.options ?? []).map((o) => (
                    <label key={o} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={c.key}
                        value={o}
                        required={c.required}
                        checked={singles[c.key] === o}
                        onChange={() => setSingles((s) => ({ ...s, [c.key]: o }))}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              ) : null}
              {c.type === "multi" ? (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(c.options ?? []).map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name={c.key} value={o} className="size-4 shrink-0" />
                        {o}
                      </label>
                    ))}
                  </div>
                  {c.allowAutre ? (
                    <Input
                      name={`${c.key}_autre`}
                      placeholder="Autre (préciser)"
                      className="mt-2"
                    />
                  ) : null}
                </>
              ) : null}
              {c.type === "note5" ? (
                <Scale
                  value={notes[c.key] ?? null}
                  onChange={(n) => setNotes((s) => ({ ...s, [c.key]: n }))}
                  min={1}
                  max={5}
                />
              ) : null}
              {c.type === "nps" ? (
                <Scale
                  value={notes[c.key] ?? null}
                  onChange={(n) => setNotes((s) => ({ ...s, [c.key]: n }))}
                  min={0}
                  max={10}
                />
              ) : null}
              {c.type === "matrice" ? (
                <Matrice
                  champ={c}
                  values={matrices[c.key] ?? {}}
                  onChange={(ligneKey, n) =>
                    setMatrices((m) => ({ ...m, [c.key]: { ...(m[c.key] ?? {}), [ligneKey]: n } }))
                  }
                />
              ) : null}
            </div>
          ))}
        </Section>
      ))}

      {error ? <p className="text-sm text-status-nc-mineure">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le compte rendu"}
      </Button>
      <p className="text-center text-muted-foreground text-xs">
        Compte rendu de suivi de prestation · {nomSociete}
      </p>
    </form>
  );
}
