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
  liste_diffusion: string | null;
  couleur_charte: string | null;
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
      listeDiffusion: f.get("listeDiffusion") || undefined,
      couleurCharte: f.get("couleurCharte") || undefined,
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="couleurCharte">Couleur de la charte (documents générés)</Label>
        <div className="flex items-center gap-3">
          <input
            id="couleurCharte"
            name="couleurCharte"
            type="color"
            defaultValue={infos.couleur_charte ?? "#0b1120"}
            className="h-9 w-14 cursor-pointer rounded-md border bg-transparent p-1"
          />
          <span className="text-muted-foreground text-xs">
            Couleur principale appliquée à l'en-tête, aux filets et aux accents des documents
            (procédures, politique, comptes-rendus…). Votre logo apparaît déjà sur ces documents.
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="listeDiffusion">Liste de diffusion « toute la société »</Label>
        <Input
          id="listeDiffusion"
          name="listeDiffusion"
          type="email"
          defaultValue={infos.liste_diffusion ?? ""}
          placeholder="Ex. tous@masociete.fr"
        />
        <p className="text-muted-foreground text-xs">
          Adresse de liste de diffusion (créée dans Microsoft 365). Utilisée pour envoyer une
          communication à toute la société depuis le module Communications.
        </p>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
