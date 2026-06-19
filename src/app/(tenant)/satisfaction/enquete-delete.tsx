"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteEnqueteAction } from "@/lib/actions/satisfaction";

export function EnqueteDelete({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!confirm("Supprimer cette réponse ?")) return;
    setPending(true);
    const r = await deleteEnqueteAction(id);
    setPending(false);
    if (r.ok) router.refresh();
    else toast.error(r.error);
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Supprimer" disabled={pending} onClick={remove}>
      <Trash2 className="size-4" />
    </Button>
  );
}
