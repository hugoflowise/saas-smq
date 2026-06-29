"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveRevueAction } from "@/lib/actions/audits-revues";

/**
 * Bouton d'approbation de la revue de direction (§9.3).
 * Affiché uniquement aux rôles direction / approbateur (`canApprove`).
 */
export function RevueApprobation({ revueId }: { revueId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await approveRevueAction(revueId);
    setPending(false);
    if (result.ok) {
      toast.success("Revue de direction approuvée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button type="button" size="sm" onClick={handleClick} disabled={pending}>
      <CheckCircle2 className="size-3.5" />
      {pending ? "Approbation…" : "Approuver la revue"}
    </Button>
  );
}
