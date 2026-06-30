"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSignalementPublicAction } from "@/lib/actions/signalement-public";
import { SELECT_CLASS } from "@/lib/ui-classes";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border bg-surface p-4">
      <legend className="px-1 font-medium text-sm">{titre}</legend>
      {children}
    </fieldset>
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
      declarantNom: f.get("declarantNom") || undefined,
      declarantEmail: f.get("declarantEmail") || undefined,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Section titre="Vous">
        <div className="flex flex-col gap-2">
          <Label htmlFor="declarantRole">Vous êtes</Label>
          <select id="declarantRole" name="declarantRole" className={SELECT_CLASS} defaultValue="">
            <option value="" disabled>
              Sélectionnez…
            </option>
            <option value="business_manager">Business manager</option>
            <option value="consultant">Consultant</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="declarantNom">Votre nom (optionnel)</Label>
            <Input id="declarantNom" name="declarantNom" maxLength={160} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="declarantEmail">Votre e-mail (optionnel)</Label>
            <Input id="declarantEmail" name="declarantEmail" type="email" maxLength={200} />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Vos coordonnées sont facultatives ; elles permettent à la qualité de vous recontacter.
        </p>
      </Section>

      <Section titre="Le signalement">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Nature</Label>
            <select id="type" name="type" className={SELECT_CLASS} defaultValue="reclamation">
              <option value="reclamation">Réclamation</option>
              <option value="dysfonctionnement">Dysfonctionnement</option>
              <option value="incident">Incident</option>
              <option value="accident">Accident</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gravite">Gravité ressentie</Label>
            <select id="gravite" name="gravite" className={SELECT_CLASS} defaultValue="mineure">
              <option value="mineure">Mineure</option>
              <option value="majeure">Majeure</option>
              <option value="critique">Critique</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="objet">Objet</Label>
          <Input
            id="objet"
            name="objet"
            required
            maxLength={200}
            placeholder="Résumé en quelques mots"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Décrivez ce qui s'est passé : dates, lieu, mission/client concerné, conséquences…"
          />
        </div>
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
