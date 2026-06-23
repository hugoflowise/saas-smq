"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMembreAction } from "@/lib/actions/membres";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { ROLE_MEMBRE_LABELS, ROLES_ASSIGNABLES } from "@/lib/permissions";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function InviteDialog() {
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) =>
        inviteMembreAction({
          email: f.get("email"),
          fullName: f.get("fullName") || undefined,
          role: f.get("role"),
        }),
      success: "Invitation envoyée.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5">
            <UserPlus className="size-4" />
            Inviter un utilisateur
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="prenom.nom@societe.fr"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input id="fullName" name="fullName" placeholder="Prénom Nom" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Rôle</Label>
            <select id="role" name="role" className={SELECT_CLASS} defaultValue="manager">
              {ROLES_ASSIGNABLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_MEMBRE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-muted-foreground text-xs">
            La personne recevra un e-mail pour définir son mot de passe et accéder à l'espace
            qualité.
          </p>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Envoi…" : "Envoyer l'invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
