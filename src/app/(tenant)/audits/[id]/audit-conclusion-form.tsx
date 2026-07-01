"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAuditConclusionAction } from "@/lib/actions/audits-revues";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/**
 * Conclusion de l'audit : écarts constatés puis rapport. Saisis APRÈS la grille,
 * pour respecter la trame logique (contexte → questions → constats → conclusion).
 */
export function AuditConclusionForm({
  auditId,
  rapport,
  ecartsConstates,
}: {
  auditId: string;
  rapport: string | null;
  ecartsConstates: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setPending(true);
    const result = await updateAuditConclusionAction({
      id: auditId,
      ecartsConstates: f.get("ecartsConstates") || undefined,
      rapport: f.get("rapport") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Conclusion enregistrée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ecartsConstates">Écarts constatés</Label>
        <Textarea
          id="ecartsConstates"
          name="ecartsConstates"
          rows={6}
          defaultValue={ecartsConstates ?? ""}
          placeholder="Synthèse des écarts relevés dans la grille ci-dessus."
        />
        <p className="text-muted-foreground text-xs">
          Décrivez les écarts ici, puis créez les actions correctives associées dans l'encart
          ci-dessous.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rapport">Rapport d'audit (conclusion)</Label>
        <Textarea id="rapport" name="rapport" rows={12} defaultValue={rapport ?? ""} />
      </div>

      {readOnly ? null : (
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer la conclusion"}
          </Button>
        </div>
      )}
    </form>
  );
}
