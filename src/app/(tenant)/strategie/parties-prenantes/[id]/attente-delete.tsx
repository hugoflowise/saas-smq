"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAttenteAction } from "@/lib/actions/parties-prenantes";

export function AttenteDelete({ id, partieId }: { id: string; partieId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer cette attente ?")) return;
    setPending(true);
    const result = await deleteAttenteAction(id, partieId);
    setPending(false);
    if (result.ok) {
      toast.success("Attente supprimée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Supprimer"
      disabled={pending}
      onClick={handleDelete}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
