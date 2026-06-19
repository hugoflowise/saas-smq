"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateInfosSocieteAction } from "@/lib/actions/infos-societe";

export type InfosSociete = {
  forme_juridique: string | null;
  siret: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  mentions_legales: string | null;
};

export function InfosSocieteForm({ infos }: { infos: InfosSociete }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await updateInfosSocieteAction({
      formeJuridique: f.get("formeJuridique") || undefined,
      siret: f.get("siret") || undefined,
      adresse: f.get("adresse") || undefined,
      codePostal: f.get("codePostal") || undefined,
      ville: f.get("ville") || undefined,
      mentionsLegales: f.get("mentionsLegales") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Informations société enregistrées.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="formeJuridique">Forme juridique</Label>
          <Input
            id="formeJuridique"
            name="formeJuridique"
            defaultValue={infos.forme_juridique ?? ""}
            placeholder="SAS, SARL…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="siret">SIRET</Label>
          <Input id="siret" name="siret" defaultValue={infos.siret ?? ""} />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="adresse">Adresse</Label>
          <Input id="adresse" name="adresse" defaultValue={infos.adresse ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="codePostal">Code postal</Label>
          <Input id="codePostal" name="codePostal" defaultValue={infos.code_postal ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ville">Ville</Label>
          <Input id="ville" name="ville" defaultValue={infos.ville ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="mentionsLegales">Mentions légales (pied de page)</Label>
        <Textarea
          id="mentionsLegales"
          name="mentionsLegales"
          rows={2}
          defaultValue={infos.mentions_legales ?? ""}
          placeholder="Ex. Capital 50 000 € · RCS Paris 123 456 789 · APE 7022Z"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
