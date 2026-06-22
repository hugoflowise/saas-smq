"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ignorerSuggestionAction, retenirSuggestionAction } from "@/lib/actions/veille-suggestions";

export function SuggestionActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function agir(action: "retenir" | "ignorer") {
    setPending(true);
    const r =
      action === "retenir" ? await retenirSuggestionAction(id) : await ignorerSuggestionAction(id);
    setPending(false);
    if (r.ok) {
      toast.success(action === "retenir" ? "Texte ajouté à la veille." : "Suggestion ignorée.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      <Button size="sm" className="gap-1.5" disabled={pending} onClick={() => agir("retenir")}>
        <Check className="size-3.5" />
        Retenir
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-muted-foreground"
        disabled={pending}
        onClick={() => agir("ignorer")}
      >
        <X className="size-3.5" />
        Ignorer
      </Button>
    </div>
  );
}
