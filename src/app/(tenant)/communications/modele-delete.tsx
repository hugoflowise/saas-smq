"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteModeleAction } from "@/lib/actions/communications-modeles";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export function ModeleDelete({ id, titre }: { id: string; titre: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();

  async function remove() {
    if (!window.confirm(`Supprimer le modèle « ${titre} » ?`)) return;
    setPending(true);
    const r = await deleteModeleAction(id);
    setPending(false);
    if (r.ok) {
      toast.success("Modèle supprimé.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  if (readOnly) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      disabled={pending}
      onClick={remove}
    >
      <Trash2 className="size-3.5" />
      Supprimer
    </Button>
  );
}
