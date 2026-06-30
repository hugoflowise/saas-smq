"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteJalonAction } from "@/lib/actions/cycle-certification";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export function JalonDelete({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();

  async function remove() {
    if (!confirm("Supprimer ce jalon ?")) return;
    setPending(true);
    const r = await deleteJalonAction(id);
    setPending(false);
    if (r.ok) router.refresh();
    else toast.error(r.error);
  }

  // Suppression masquée pour l'auditeur (lecture seule).
  if (readOnly) return null;

  return (
    <Button variant="ghost" size="icon" aria-label="Supprimer" disabled={pending} onClick={remove}>
      <Trash2 className="size-4" />
    </Button>
  );
}
