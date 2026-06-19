"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateAuditProgrammeAction } from "@/lib/actions/audits-revues";

export function ProgrammeButton({ annee }: { annee: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (
      !confirm(
        `Créer un audit interne planifié pour chaque processus (programme ${annee}) ? Vous pourrez ensuite ajuster les dates.`,
      )
    ) {
      return;
    }
    setPending(true);
    const r = await generateAuditProgrammeAction(annee);
    setPending(false);
    if (r.ok) {
      toast.success(`Programme ${annee} initialisé.`);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Button variant="outline" className="gap-2" disabled={pending} onClick={handleClick}>
      <CalendarPlus className="size-4" />
      {pending ? "Création…" : `Programme ${annee}`}
    </Button>
  );
}
