"use client";

import { MessageSquarePlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRetourAction } from "@/lib/actions/retours";
import { compresserImage } from "@/lib/compress-image";
import { RETOUR_TYPE_LABELS } from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

// Limite de corps de requête de la plateforme (~4,5 Mo sur Vercel) : on garde une
// marge sous ce seuil pour éviter un échec silencieux côté Server Action.
const MAX_ENVOI = 4 * 1024 * 1024;

/**
 * Bouton de retour accessible depuis toutes les pages (topbar). Permet à tout
 * utilisateur de signaler un bug, une remarque ou une demande d'évolution.
 */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // Contexte : page d'où le retour est envoyé.
    form.set("pageUrl", typeof window !== "undefined" ? window.location.pathname : "");
    setPending(true);
    try {
      // Compression des images (captures d'écran surtout) avant envoi, pour
      // rester sous la limite de corps de requête de la plateforme.
      const fichiers = form
        .getAll("fichiers")
        .filter((f): f is File => f instanceof File && f.size > 0);
      if (fichiers.length > 0) {
        const compresses = await Promise.all(fichiers.map((f) => compresserImage(f)));
        const trop = compresses.find((f) => f.size > MAX_ENVOI);
        if (trop) {
          toast.error(
            `« ${trop.name} » est trop lourd même après compression. Joignez un fichier plus léger (max ~4 Mo).`,
          );
          setPending(false);
          return;
        }
        form.delete("fichiers");
        for (const f of compresses) form.append("fichiers", f);
      }

      const result = await createRetourAction(form);
      if (result.ok) {
        toast.success("Merci ! Votre retour a bien été transmis.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(
        "L'envoi a échoué (fichier trop volumineux ou réseau). Réessayez sans la pièce jointe.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2" aria-label="Signaler ou suggérer">
            <MessageSquarePlus className="size-4" />
            <span className="hidden lg:inline">Signaler / Suggérer</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Signaler ou suggérer</DialogTitle>
          <DialogDescription>
            Signalez un bug, une remarque ou une idée d'amélioration. L'équipe Flowise les examine.
          </DialogDescription>
        </DialogHeader>
        {/* key={open} : réinitialise le formulaire à chaque ouverture */}
        <form key={String(open)} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" className={SELECT_CLASS} defaultValue="remarque">
              {Object.entries(RETOUR_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="titre">Objet</Label>
            <Input
              id="titre"
              name="titre"
              required
              placeholder="Ex. : le bouton Enregistrer ne réagit pas sur la page Risques"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Détail (facultatif)</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Décrivez ce qui s'est passé, ce que vous attendiez, ou votre idée…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fichiers">Capture d'écran ou fichier (facultatif)</Label>
            <Input
              id="fichiers"
              name="fichiers"
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
            />
            <p className="text-muted-foreground text-xs">
              Jusqu'à 4 fichiers. Les images sont automatiquement compressées. Une capture aide
              beaucoup à comprendre.
            </p>
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Envoi…" : "Envoyer le retour"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
