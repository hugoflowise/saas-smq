"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSuiviPrestationAction } from "@/lib/actions/suivi-prestation";
import {
  AXE_NOTE_LABELS,
  BESOINS_OPTIONS,
  BILAN_OPTIONS,
  OUI_NON_SO,
  PLAN_ACTIONS_OPTIONS,
  QSSE_FIELDS,
  SATISFACTION_AXES,
} from "@/lib/suivi-prestation";

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

function Scale({
  value,
  onChange,
  max,
  min = 0,
}: {
  value: number | null;
  onChange: (n: number) => void;
  max: number;
  min?: number;
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

function CheckGroup({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label key={o} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={name} value={o} className="size-4 shrink-0" />
          {o}
        </label>
      ))}
    </div>
  );
}

export function SuiviForm({ token, nomSociete }: { token: string; nomSociete: string }) {
  const [perimetre, setPerimetre] = useState<string>("");
  const [axes, setAxes] = useState<Record<string, number>>({});
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [nps, setNps] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const get = (k: string) => (f.get(k) as string) || "";
    const getAll = (k: string) => f.getAll(k).map(String);

    if (SATISFACTION_AXES.some((a) => axes[a.key] == null)) {
      setError("Merci de noter chaque axe de satisfaction (section 3).");
      return;
    }
    if (satisfaction === null) {
      setError("Merci d'indiquer la satisfaction globale (section 6).");
      return;
    }
    if (nps === null) {
      setError("Merci d'indiquer la note de recommandation (section 6).");
      return;
    }
    if (getAll("plan_actions").length === 0) {
      setError("Merci d'indiquer au moins une action à prévoir (section 8).");
      return;
    }
    setError(null);
    setPending(true);

    const reponses = {
      consultant: get("consultant"),
      client: get("client"),
      mission: get("mission"),
      date_suivi: get("date_suivi"),
      manager: get("manager"),
      realisations_passees: get("realisations_passees"),
      realisations_a_venir: get("realisations_a_venir"),
      perimetre_evolue: perimetre,
      ecarts_details: get("ecarts_details"),
      satisfaction_axes: axes,
      points_forts: getAll("points_forts"),
      points_forts_autre: get("points_forts_autre"),
      axes_amelioration: getAll("axes_amelioration"),
      axes_amelioration_autre: get("axes_amelioration_autre"),
      commentaire_bilan: get("commentaire_bilan"),
      securite_consignes: get("securite_consignes"),
      securite_epi: get("securite_epi"),
      plan_prevention: get("plan_prevention"),
      satisfaction_globale: satisfaction,
      nps,
      commentaire_satisfaction: get("commentaire_satisfaction"),
      besoins_futurs: getAll("besoins_futurs"),
      besoins_futurs_autre: get("besoins_futurs_autre"),
      amelioration_prestations: get("amelioration_prestations"),
      plan_actions: getAll("plan_actions"),
      plan_actions_autre: get("plan_actions_autre"),
      delais_actions: get("delais_actions"),
      nouvelle_date_suivi: get("nouvelle_date_suivi"),
      commentaire_plan: get("commentaire_plan"),
      nom_representant: get("nom_representant"),
      mail_representant: get("mail_representant"),
    };

    const result = await submitSuiviPrestationAction({
      token,
      consultant: get("consultant"),
      client: get("client"),
      mission: get("mission"),
      manager: get("manager"),
      dateSuivi: get("date_suivi"),
      perimetreEvolue: perimetre,
      satisfactionGlobale: satisfaction,
      nps,
      nouvelleDateSuivi: get("nouvelle_date_suivi"),
      attestation: f.get("attestation") === "on",
      nomRepresentant: get("nom_representant"),
      mailRepresentant: get("mail_representant"),
      reponses,
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Section n={1} title="Contexte de la visite">
        <Field label="Consultant (Prénom NOM)" required>
          <Input name="consultant" required />
        </Field>
        <Field label="Client / entité" required>
          <Input name="client" required />
        </Field>
        <Field label="Mission / poste occupé" required>
          <Input name="mission" required />
        </Field>
        <Field label="Date du suivi" required>
          <Input name="date_suivi" type="date" required />
        </Field>
        <Field label="Manager (Prénom NOM)" required>
          <Input name="manager" required />
        </Field>
      </Section>

      <Section n={2} title="Activité et périmètre">
        <Field label="Réalisations passées (depuis le dernier point)">
          <Textarea name="realisations_passees" rows={3} />
        </Field>
        <Field label="Réalisations à venir">
          <Textarea name="realisations_a_venir" rows={3} />
        </Field>
        <Field
          label="Le périmètre de la mission a-t-il évolué par rapport au contrat signé ?"
          required
        >
          <div className="flex gap-4 text-sm">
            {["Oui", "Non"].map((o) => (
              <label key={o} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="perimetre_evolue"
                  value={o}
                  required
                  checked={perimetre === o}
                  onChange={() => setPerimetre(o)}
                />
                {o}
              </label>
            ))}
          </div>
        </Field>
        {perimetre === "Oui" ? (
          <Field label="Si oui, lesquels ?">
            <Textarea name="ecarts_details" rows={3} />
          </Field>
        ) : null}
      </Section>

      <Section n={3} title="Satisfaction sur la prestation">
        <p className="text-muted-foreground text-sm">
          Notez de 1 (très insatisfait) à 4 (très satisfait).
        </p>
        <div className="flex flex-col gap-3">
          {SATISFACTION_AXES.map((axe) => (
            <div key={axe.key} className="flex flex-col gap-1.5">
              <span className="text-sm">
                {axe.label} <span className="text-status-nc-mineure">*</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    title={AXE_NOTE_LABELS[n]}
                    onClick={() => setAxes((a) => ({ ...a, [axe.key]: n }))}
                    className={`h-9 rounded-lg border px-3 font-medium text-sm transition-colors ${
                      axes[axe.key] === n
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
      </Section>

      <Section n={4} title="Bilan qualitatif">
        <Field label="Points forts / succès" required>
          <CheckGroup name="points_forts" options={BILAN_OPTIONS} />
          <Input name="points_forts_autre" placeholder="Autre (préciser)" className="mt-2" />
        </Field>
        <Field label="Axes d'amélioration / difficultés" required>
          <CheckGroup name="axes_amelioration" options={BILAN_OPTIONS} />
          <Input name="axes_amelioration_autre" placeholder="Autre (préciser)" className="mt-2" />
        </Field>
        <Field label="Commentaire">
          <Textarea name="commentaire_bilan" rows={3} />
        </Field>
      </Section>

      <Section n={5} title="Sécurité (QSSE)">
        {QSSE_FIELDS.map((q) => (
          <Field key={q.key} label={q.label} required>
            <div className="flex flex-wrap gap-4 text-sm">
              {OUI_NON_SO.map((o) => (
                <label key={o} className="flex items-center gap-2">
                  <input type="radio" name={q.key} value={o} required />
                  {o}
                </label>
              ))}
            </div>
          </Field>
        ))}
      </Section>

      <Section n={6} title="Satisfaction globale et recommandation">
        <Field label="Quelle est votre satisfaction globale ? (1 à 5)" required>
          <Scale value={satisfaction} onChange={setSatisfaction} min={1} max={5} />
        </Field>
        <Field label="Sur une échelle de 0 à 10, recommanderiez-vous nos prestations ?" required>
          <Scale value={nps} onChange={setNps} min={0} max={10} />
        </Field>
        <Field label="Commentaire">
          <Textarea name="commentaire_satisfaction" rows={3} />
        </Field>
      </Section>

      <Section n={7} title="Développement et suite">
        <Field label="Quels sont vos futurs projets / autres besoins ?">
          <CheckGroup name="besoins_futurs" options={BESOINS_OPTIONS} />
          <Input name="besoins_futurs_autre" placeholder="Autre (préciser)" className="mt-2" />
        </Field>
        <Field label="Comment pourrions-nous améliorer nos prestations ?">
          <Textarea name="amelioration_prestations" rows={3} />
        </Field>
      </Section>

      <Section n={8} title="Plan d'actions">
        <Field label="Action à prévoir" required>
          <CheckGroup name="plan_actions" options={PLAN_ACTIONS_OPTIONS} />
          <Input name="plan_actions_autre" placeholder="Autre (préciser)" className="mt-2" />
        </Field>
        <Field label="Délais de réalisation des actions">
          <Input name="delais_actions" />
        </Field>
        <Field label="Nouvelle date de suivi" required>
          <Input name="nouvelle_date_suivi" type="date" required />
        </Field>
        <Field label="Commentaire">
          <Textarea name="commentaire_plan" rows={3} />
        </Field>
      </Section>

      <Section n={9} title="Validation">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="attestation" required className="mt-0.5 size-4 shrink-0" />
          Je certifie sur l'honneur l'exactitude des renseignements de ce compte rendu, rédigé avec
          le client.
        </label>
        <Field label="Nom du représentant client" required>
          <Input name="nom_representant" required />
        </Field>
        <Field label="Adresse mail du représentant client" required>
          <Input name="mail_representant" type="email" required />
        </Field>
      </Section>

      {error ? <p className="text-sm text-status-nc-mineure">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le compte rendu"}
      </Button>
      <p className="text-center text-muted-foreground text-xs">
        Compte rendu de suivi de prestation — {nomSociete}
      </p>
    </form>
  );
}
