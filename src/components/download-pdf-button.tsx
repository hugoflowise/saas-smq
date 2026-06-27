"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Bouton de téléchargement PDF en 1 clic.
 *
 * Appelle la route `/api/pdf/...` (rendu serveur fidèle via Chromium headless)
 * et déclenche le téléchargement du fichier, avec état de chargement et toast
 * d'erreur. À préférer à un simple lien vers `/print` : pas d'étape « aperçu »,
 * pas de boîte d'impression du navigateur.
 *
 * @param printHref chemin de la page d'aperçu (`/print/...`) ; converti en
 *   `/api/pdf/...` automatiquement.
 * @param iconOnly mode icône seule (ex. cellule de tableau).
 */
export function DownloadPdfButton({
  printHref,
  label = "Télécharger PDF",
  variant = "outline",
  size = "sm",
  iconOnly = false,
}: {
  printHref: string;
  label?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  iconOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function download() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(printHref.replace("/print/", "/api/pdf/"));
      if (!res.ok) throw new Error("pdf");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Génération du PDF impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        disabled={loading}
        onClick={download}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className="gap-2" disabled={loading} onClick={download}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {loading ? "Génération…" : label}
    </Button>
  );
}
