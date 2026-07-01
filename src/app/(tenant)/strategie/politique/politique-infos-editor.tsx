"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ENGAGEMENTS_DIRECTION_DEFAUT } from "@/components/politique-sections";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePolitiqueSectionsAction } from "@/lib/actions/politique";

export type PolitiqueSectionsInitial = {
  presentation: string;
  valeurs: string;
  engagementsIntro: string;
  objectifsTexte: string;
  engagementDirection: string;
};

export function PolitiqueInfosEditor({ initial }: { initial: PolitiqueSectionsInitial }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    const result = await savePolitiqueSectionsAction({
      presentation: (f.get("presentation") as string) || undefined,
      valeurs: (f.get("valeurs") as string) || undefined,
      engagementsIntro: (f.get("engagementsIntro") as string) || undefined,
      objectifsTexte: (f.get("objectifsTexte") as string) || undefined,
      engagementDirection: (f.get("engagementDirection") as string) || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Sections enregistrées.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-sm"
    >
      <h3 className="font-semibold text-sm">Sections de la politique</h3>

      <Champ
        name="presentation"
        label="1. Présentation et périmètre d'application"
        defaultValue={initial.presentation}
        rows={4}
        placeholder="Présentez votre société, ses activités, et à qui/quoi s'applique la politique (sites, collaborateurs, prestataires…)."
      />
      <Champ
        name="valeurs"
        label="2. Nos valeurs (une par ligne)"
        defaultValue={initial.valeurs}
        rows={4}
        placeholder={
          "Proximité : avec nos clients et nos collaborateurs\nPerformance : …\nConfiance : …"
        }
      />
      <Champ
        name="engagementsIntro"
        label="3. Nos engagements - texte d'introduction (l'ambition)"
        defaultValue={initial.engagementsIntro}
        rows={3}
        placeholder="Notre ambition est de satisfaire durablement nos clients et nos collaborateurs… (la LISTE des engagements se gère juste en dessous, reliée aux objectifs/KPI)."
      />
      <Champ
        name="objectifsTexte"
        label="4. Nos objectifs - texte (facultatif : un lien vers vos objectifs est ajouté automatiquement)"
        defaultValue={initial.objectifsTexte}
        rows={3}
        placeholder="Laissez vide pour le texte standard, ou personnalisez : « Cette politique constitue le cadre de référence pour nos objectifs qualité annuels… »"
      />
      <div className="flex flex-col gap-1">
        <Champ
          name="engagementDirection"
          label="5. Engagement de la Direction - une action par ligne (pré-rempli avec les engagements-types)"
          defaultValue={initial.engagementDirection || ENGAGEMENTS_DIRECTION_DEFAUT}
          rows={6}
        />
        <p className="text-muted-foreground text-xs">
          Ce sont les engagements de la Direction (ressources, RSMQ, revue, conformité,
          amélioration) - distincts de « Nos engagements » qui sont ceux de l'organisme. Ajustez-les
          si besoin.
        </p>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les sections"}
        </Button>
      </div>
    </form>
  );
}

function Champ({
  name,
  label,
  defaultValue,
  rows,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </div>
  );
}
