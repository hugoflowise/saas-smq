"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteConsultantAction } from "@/lib/actions/consultants";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export function ConsultantDelete({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();

  async function remove() {
    if (!confirm("Retirer ce consultant du référentiel ?")) return;
    setPending(true);
    const r = await deleteConsultantAction(id);
    setPending(false);
    if (r.ok) router.refresh();
    else toast.error(r.error);
  }

  if (readOnly) return null;

  return (
    <Button variant="ghost" size="icon" aria-label="Supprimer" disabled={pending} onClick={remove}>
      <Trash2 className="size-4" />
    </Button>
  );
}
