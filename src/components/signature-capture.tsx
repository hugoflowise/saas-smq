"use client";

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
import { createClient } from "@/lib/supabase/client";

type Props = {
  triggerLabel: string;
  title?: string;
  description?: string;
  /** Appelé après vérification du mot de passe. Doit effectuer l'action signée. */
  onSigned: () => Promise<void>;
  disabled?: boolean;
};

/**
 * Capture de signature électronique interne (CDC §8.3) : l'utilisateur
 * re-saisit son mot de passe pour confirmer. La vérification se fait via
 * Supabase ; l'horodatage / IP sont enregistrés côté serveur par l'action.
 */
export function SignatureCapture({ triggerLabel, title, description, onSigned, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setPending(false);
      toast.error("Session introuvable.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (error) {
      setPending(false);
      toast.error("Mot de passe incorrect.");
      return;
    }

    await onSigned();
    setPending(false);
    setPassword("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button disabled={disabled}>{triggerLabel}</Button>} />
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title ?? "Signature électronique"}</DialogTitle>
          <DialogDescription>
            {description ??
              "Confirmez votre identité avec votre mot de passe pour signer ce document."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="signature-password">Mot de passe</Label>
            <Input
              id="signature-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Vérification…" : "Signer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
