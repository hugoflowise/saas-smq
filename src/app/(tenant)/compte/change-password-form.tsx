"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markPasswordSetAction } from "@/lib/actions/compte";
import { createClient } from "@/lib/supabase/client";

const MIN_LONGUEUR = 8;

/**
 * Formulaire de définition / changement de mot de passe.
 * `reloginAfter` (page /bienvenue, après invitation/réinitialisation) : une fois
 * le mot de passe défini, on déconnecte et on renvoie vers la connexion pour que
 * l'utilisateur se reconnecte avec son nouveau mot de passe (standard de sécurité).
 * Sinon (page Mon compte, déjà connecté) : on reste connecté.
 */
export function ChangePasswordForm({ reloginAfter = false }: { reloginAfter?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nouveau = String(data.get("nouveau") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");

    if (nouveau.length < MIN_LONGUEUR) {
      toast.error(`Le mot de passe doit contenir au moins ${MIN_LONGUEUR} caractères.`);
      return;
    }
    if (nouveau !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: nouveau });
      if (error) {
        toast.error(error.message);
        return;
      }
      // Lève le drapeau « mot de passe à définir » qui bloque l'accès à l'app.
      await markPasswordSetAction();
      form.reset();

      if (reloginAfter) {
        // Standard de sécurité : on n'utilise pas la session ouverte par le lien
        // e-mail comme session applicative ; on se reconnecte avec le nouveau mdp.
        await supabase.auth.signOut();
        router.push("/login?motdepasse=modifie");
        router.refresh();
      } else {
        toast.success("Mot de passe mis à jour.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nouveau">Nouveau mot de passe</Label>
        <Input
          id="nouveau"
          name="nouveau"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LONGUEUR}
          placeholder="Au moins 8 caractères"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
        <Input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LONGUEUR}
        />
      </div>
      <Button type="submit" disabled={pending} className="mt-1 self-start">
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
