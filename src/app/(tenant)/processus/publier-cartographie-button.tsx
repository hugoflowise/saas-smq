"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publishCartographieVersionAction } from "@/lib/actions/cartographie";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/** Fige l'état actuel de la cartographie comme nouvelle version (A, B, C…). */
export function PublierCartographieButton() {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);

  if (readOnly) return null;

  async function publier() {
    setPending(true);
    const r = await publishCartographieVersionAction();
    setPending(false);
    if (r.ok) {
      toast.success("Nouvelle version de la cartographie publiée.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Button variant="outline" className="gap-2" disabled={pending} onClick={publier}>
      <History className="size-4" />
      {pending ? "Publication…" : "Publier une version"}
    </Button>
  );
}
