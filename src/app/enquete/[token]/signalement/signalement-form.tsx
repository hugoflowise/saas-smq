"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSignalementPublicAction } from "@/lib/actions/signalement-public";
import { SELECT_CLASS } from "@/lib/ui-classes";

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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label} {required ? <span className="text-status-nc-mineure">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

export function SignalementForm({ token, nomSociete }: { token: string; nomSociete: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await submitSignalementPublicAction({
      token,
      declarantRole: f.get("declarantRole") || undefined,
      declarantNom: f.get("declarantNom"),
      declarantEmail: f.get("declarantEmail"),
      type: f.get("type") || undefined,
      gravite: f.get("gravite") || undefined,
      objet: f.get("objet"),
      description: f.get("description") || undefined,
      website: f.get("website") || undefined,
    });
    setPending(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-status-conforme/15 text-2xl text-status-conforme">
          ✓
        </div>
        <h2 className="font-semibold text-lg">Signalement transmis</h2>
        <p className="text-muted-foreground text-sm">
          Merci, votre signalement a bien été transmis à l'équipe qualité de {nomSociete} et sera
          traité.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section n={1} title="Vous">
        <Field label="Vous êtes" required>
          <select
            id="declarantRole"
            name="declarantRole"
            required
            className={SELECT_CLASS}
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionnez…
            </option>
            <option value="business_manager">Business manager</option>
            <option value="consultant">Consultant</option>
            <option value="autre">Autre</option>
          </select>
        </Field>
        <Field label="Votre nom (Prénom NOM)" required>
          <Input name="declarantNom" required maxLength={160} />
        </Field>
        <Field label="Votre e-mail" required>
          <Input name="declarantEmail" type="email" required maxLength={200} />
        </Field>
      </Section>

      <Section n={2} title="Le signalement">
        <Field label="Nature" required>
          <select id="type" name="type" className={SELECT_CLASS} defaultValue="reclamation">
            <option value="reclamation">Réclamation</option>
            <option value="dysfonctionnement">Dysfonctionnement</option>
            <option value="incident">Incident</option>
            <option value="accident">Accident</option>
          </select>
        </Field>
        <Field label="Gravité ressentie">
          <select id="gravite" name="gravite" className={SELECT_CLASS} defaultValue="mineure">
            <option value="mineure">Mineure</option>
            <option value="majeure">Majeure</option>
            <option value="critique">Critique</option>
          </select>
        </Field>
        <Field label="Objet" required>
          <Input name="objet" required maxLength={200} placeholder="Résumé en quelques mots" />
        </Field>
        <Field label="Description">
          <Textarea
            name="description"
            rows={5}
            placeholder="Décrivez ce qui s'est passé : dates, lieu, mission/client concerné, conséquences…"
          />
        </Field>
      </Section>

      {/* Honeypot anti-spam : masqué aux humains, ignoré côté serveur s'il est rempli. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error ? <p className="text-sm text-status-nc-mineure">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le signalement"}
      </Button>
      <p className="text-center text-muted-foreground text-xs">Signalement · {nomSociete}</p>
    </form>
  );
}
