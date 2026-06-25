"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { captureRevuePerformanceAction } from "@/lib/actions/audits-revues";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export function RevuePerformanceCapture({
  revueId,
  recapture,
}: {
  revueId: string;
  recapture: boolean;
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);

  if (readOnly) return null;

  async function handleClick() {
    setPending(true);
    const result = await captureRevuePerformanceAction(revueId);
    setPending(false);
    if (result.ok) {
      toast.success("Données de performance figées.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      <RefreshCw className="size-3.5" />
      {pending ? "Capture…" : recapture ? "Actualiser les données" : "Capturer les données"}
    </Button>
  );
}
