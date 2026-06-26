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
import { RETOUR_TYPE_LABELS } from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

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
    setPending(true);
    const result = await createRetourAction({
      type: form.get("type"),
      titre: form.get("titre"),
      description: form.get("description") || undefined,
      // Contexte : page d'où le retour est envoyé.
      pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Merci ! Votre retour a bien été transmis.");
      setOpen(false);
    } else {
      toast.error(result.error);
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
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Envoi…" : "Envoyer le retour"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
