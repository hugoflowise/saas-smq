"use client";

import { Download, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getRetourPieceUrlAction,
  type RetourPieceJointe,
  updateRetourAction,
} from "@/lib/actions/retours";
import { RETOUR_STATUT_LABELS } from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

type Retour = {
  id: string;
  numero: number;
  type: string;
  titre: string;
  description: string | null;
  pageUrl: string | null;
  statut: keyof typeof RETOUR_STATUT_LABELS;
  noteAdmin: string | null;
  auteur: string;
  auteurEmail: string | null;
  client: string | null;
  date: string;
  pieces: RetourPieceJointe[];
};

/** Taille lisible (Ko / Mo). */
function tailleLisible(o: number): string {
  if (o < 1024) return `${o} o`;
  if (o < 1024 * 1024) return `${Math.round(o / 1024)} Ko`;
  return `${(o / (1024 * 1024)).toFixed(1)} Mo`;
}

export function RetourDialog({
  retour,
  trigger,
}: {
  retour: Retour;
  /** Déclencheur personnalisé (ex. la ligne entière, cliquable). Par défaut : bouton « Traiter ». */
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [dlPath, setDlPath] = useState<string | null>(null);

  // Téléchargement : on demande une URL signée fraîche puis on ouvre l'onglet.
  async function handleDownload(piece: RetourPieceJointe) {
    setDlPath(piece.path);
    const result = await getRetourPieceUrlAction(piece.path);
    setDlPath(null);
    if (result.ok) {
      window.open(result.url, "_blank", "noopener");
    } else {
      toast.error(result.error);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await updateRetourAction({
      id: retour.id,
      statut: form.get("statut"),
      noteAdmin: form.get("noteAdmin") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Retour mis à jour.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm">
              Traiter
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <span className="font-mono text-muted-foreground">#{retour.numero}</span> {retour.titre}
          </DialogTitle>
          <DialogDescription>
            {retour.type} · {retour.auteur}
            {retour.auteurEmail ? ` (${retour.auteurEmail})` : ""}
            {retour.client ? ` · ${retour.client}` : ""} · {retour.date}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {retour.description ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="whitespace-pre-wrap">{retour.description}</p>
            </div>
          ) : null}
          {retour.pageUrl ? (
            <p className="text-muted-foreground text-xs">
              Page : <span className="font-mono">{retour.pageUrl}</span>
            </p>
          ) : null}
          {retour.pieces.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
                <Paperclip className="size-3.5" />
                {retour.pieces.length} pièce{retour.pieces.length > 1 ? "s" : ""} jointe
                {retour.pieces.length > 1 ? "s" : ""}
              </p>
              <ul className="flex flex-col gap-1">
                {retour.pieces.map((piece) => (
                  <li key={piece.path}>
                    <button
                      type="button"
                      onClick={() => handleDownload(piece)}
                      disabled={dlPath === piece.path}
                      className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition hover:bg-muted/50 disabled:opacity-60"
                    >
                      <Download className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{piece.nom}</span>
                      <span className="shrink-0 text-muted-foreground text-xs">
                        {dlPath === piece.path ? "Ouverture…" : tailleLisible(piece.taille)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="statut">Statut</Label>
            <select id="statut" name="statut" className={SELECT_CLASS} defaultValue={retour.statut}>
              {Object.entries(RETOUR_STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="noteAdmin">Note interne (facultatif)</Label>
            <Textarea
              id="noteAdmin"
              name="noteAdmin"
              rows={3}
              defaultValue={retour.noteAdmin ?? ""}
              placeholder="Décision, suite donnée, lien vers une PR…"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
