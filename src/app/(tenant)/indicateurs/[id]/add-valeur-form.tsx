"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addValeurAction } from "@/lib/actions/indicateurs";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export function AddValeurForm({ indicateurId }: { indicateurId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await addValeurAction({
      indicateurId,
      valeur: form.get("valeur"),
      dateMesure: form.get("dateMesure") || undefined,
      commentaire: form.get("commentaire") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Valeur enregistrée.");
      formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (readOnly) return null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="valeur">Valeur</Label>
        <Input id="valeur" name="valeur" type="number" step="any" required className="w-32" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="dateMesure">Date</Label>
        <Input id="dateMesure" name="dateMesure" type="date" className="w-40" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor="commentaire">Commentaire</Label>
        <Input id="commentaire" name="commentaire" placeholder="optionnel" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter"}
      </Button>
    </form>
  );
}
