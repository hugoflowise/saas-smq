"use client";

import { Download, Loader2, Paperclip, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteModelePieceAction,
  getModelePieceUrlAction,
  uploadModelePieceAction,
} from "@/lib/actions/communications-modeles";
import type { ModelePiece } from "@/lib/communications";

function tailleLisible(o: number): string {
  if (o < 1024) return `${o} o`;
  if (o < 1024 * 1024) return `${Math.round(o / 1024)} Ko`;
  return `${(o / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Gestion des pièces jointes d'un modèle de communication.
 * `manage` = true : upload + suppression. Sinon lecture/téléchargement seul
 * (au moment de l'envoi, pour joindre manuellement le fichier à l'e-mail).
 */
export function ModelePiecesJointes({
  modeleId,
  pieces,
  manage = false,
}: {
  modeleId: string;
  pieces: ModelePiece[];
  manage?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function telecharger(path: string) {
    const r = await getModelePieceUrlAction(modeleId, path);
    if (r.ok) window.open(r.url, "_blank");
    else toast.error(r.error);
  }

  async function envoyerFichiers(files: FileList) {
    const form = new FormData();
    form.set("modeleId", modeleId);
    for (const f of Array.from(files)) form.append("fichiers", f);
    setBusy(true);
    const r = await uploadModelePieceAction(form);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (r.ok) {
      toast.success("Pièce jointe ajoutée.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  async function supprimer(path: string) {
    setBusy(true);
    const r = await deleteModelePieceAction(modeleId, path);
    setBusy(false);
    if (r.ok) {
      toast.success("Pièce jointe supprimée.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {pieces.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          {manage ? "Aucune pièce jointe." : "Aucune pièce jointe pour ce modèle."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {pieces.map((p) => (
            <li
              key={p.path}
              className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm"
            >
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{p.nom}</span>
              <span className="shrink-0 text-muted-foreground text-xs">
                {tailleLisible(p.taille)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => telecharger(p.path)}
                aria-label={`Télécharger ${p.nom}`}
              >
                <Download className="size-4" />
              </Button>
              {manage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => supprimer(p.path)}
                  disabled={busy}
                  aria-label={`Supprimer ${p.nom}`}
                >
                  <X className="size-4 text-status-nc-mineure" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {manage ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) envoyerFichiers(e.target.files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Ajouter une pièce jointe
          </Button>
          <p className="mt-1 text-muted-foreground text-xs">
            Jusqu'à 5 fichiers, 10 Mo chacun. Le fichier n'est pas envoyé automatiquement : à
            l'envoi, téléchargez-le et joignez-le à votre e-mail.
          </p>
        </div>
      ) : null}
    </div>
  );
}
