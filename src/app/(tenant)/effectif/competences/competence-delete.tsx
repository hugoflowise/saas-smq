"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteCompetenceAction } from "@/lib/actions/competences";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/** Suppression (corbeille) d'une compétence du référentiel. */
export function CompetenceDelete({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();

  async function remove() {
    if (!confirm("Supprimer cette compétence du référentiel ?")) return;
    setPending(true);
    const r = await deleteCompetenceAction(id);
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
