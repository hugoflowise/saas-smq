"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { restoreFromCorbeilleAction } from "@/lib/actions/corbeille";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/**
 * Bouton de restauration d'un élément en corbeille. Masqué pour les rôles en
 * lecture seule (auditeur) - la sécurité reste imposée côté serveur.
 */
export function RestaurerButton({ table, id }: { table: string; id: string }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);

  if (readOnly) return null;

  async function handleRestore() {
    setPending(true);
    const result = await restoreFromCorbeilleAction(table, id);
    setPending(false);
    if (result.ok) {
      toast.success("Élément restauré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 shrink-0 gap-1.5"
      disabled={pending}
      onClick={handleRestore}
    >
      <RotateCcw className="size-3.5" />
      {pending ? "Restauration…" : "Restaurer"}
    </Button>
  );
}
