"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
        label="3. Nos engagements — introduction (l'ambition)"
        defaultValue={initial.engagementsIntro}
        rows={3}
        placeholder="Notre ambition est de… La liste des engagements se gère dans l'encart « Engagements de la politique » (reliés aux objectifs/KPI)."
      />
      <Champ
        name="objectifsTexte"
        label="4. Nos objectifs"
        defaultValue={initial.objectifsTexte}
        rows={3}
        placeholder="Cette politique constitue le cadre de référence pour nos objectifs qualité annuels, déclinés par processus et suivis dans un tableau de bord dédié."
      />
      <Champ
        name="engagementDirection"
        label="5. Engagement de la Direction (une action par ligne)"
        defaultValue={initial.engagementDirection}
        rows={5}
        placeholder={
          "Allouer les ressources nécessaires\nDésigner un responsable du système de management (RSMQ)\nPiloter l'efficacité via une revue de direction annuelle\nVeiller à la conformité légale et réglementaire\nAméliorer en continu le système de management"
        }
      />

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
