"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSuiviConsultantAction } from "@/lib/actions/suivi-consultant";
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

export function SuiviConsultantForm({
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
        } else if (c.type === "multi") {
          reponses[c.key] = f.getAll(c.key).map(String);
          if (c.allowAutre) reponses[`${c.key}_autre`] = (f.get(`${c.key}_autre`) as string) || "";
        } else {
          reponses[c.key] = (f.get(c.key) as string) || "";
        }
      }
    }

    // Validation des champs requis non gérés nativement (multi, notes).
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
      }
    }

    setError(null);
    setPending(true);
    const result = await submitSuiviConsultantAction({ token, reponses, modeleVersion });
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
        <h2 className="font-semibold text-lg">Suivi enregistré</h2>
        <p className="text-muted-foreground text-sm">
          Merci, votre suivi consultant a bien été transmis.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {sections.map((section) => (
        <Section key={section.n} n={section.n} title={section.title}>
          {section.champs.filter(visible).map((c) => (
            <div key={c.key} className="flex flex-col gap-1.5">
              <FieldLabel label={c.label} required={c.required} />
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
            </div>
          ))}
        </Section>
      ))}

      {error ? <p className="text-sm text-status-nc-mineure">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le suivi"}
      </Button>
      <p className="text-center text-muted-foreground text-xs">Suivi consultant · {nomSociete}</p>
    </form>
  );
}
