"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMonNomAction } from "@/lib/actions/compte";

/** Saisie/modification du nom complet de l'utilisateur connecté. */
export function NomForm({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setPending(true);
    const result = await updateMonNomAction({ fullName: f.get("fullName") });
    setPending(false);
    if (result.ok) {
      toast.success("Nom mis à jour.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          defaultValue={fullName}
          placeholder="Hugo Piovesan"
        />
        <p className="text-muted-foreground text-xs">
          Ce nom s'affiche sur les documents (pilote, signatures…) à la place de votre e-mail.
        </p>
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
