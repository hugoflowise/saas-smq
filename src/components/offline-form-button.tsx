"use client";

import { WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { genererFormulaireHorsLigneAction } from "@/lib/actions/formulaire-hors-ligne";
import type { FormulaireType } from "@/lib/formulaire-modeles";

/**
 * Télécharge le formulaire de suivi sous forme de fichier HTML autonome,
 * utilisable sans connexion (rempli chez le client, synchronisé au retour du
 * réseau). Le fichier est généré côté serveur avec la définition personnalisée
 * du client et sa version.
 */
export function OfflineFormButton({
  type,
  label = "Formulaire hors-ligne",
}: {
  type: FormulaireType;
  label?: string;
}) {
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    const result = await genererFormulaireHorsLigneAction(type);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob([result.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Formulaire téléchargé. Ouvrez-le sur l'ordinateur qui servira hors-ligne.");
  }

  return (
    <Button variant="outline" className="gap-2" onClick={download} disabled={pending}>
      <WifiOff className="size-4" />
      {pending ? "Génération…" : label}
    </Button>
  );
}
