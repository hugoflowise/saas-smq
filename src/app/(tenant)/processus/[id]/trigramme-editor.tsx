"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { saveProcessusCodeAction } from "@/lib/actions/processus";
import { normalizeTrigramme } from "@/lib/codification";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/**
 * Trigramme (code court) du processus, éditable en ligne par un rédacteur.
 * Il alimente les références documentaires `{FAMILLE}_{TRIGRAMME}_{CHRONO}`.
 * Tant qu'il est vide, on l'indique clairement : aucun code n'est généré.
 */
export function TrigrammeEditor({ id, initial }: { id: string; initial: string | null }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  if (readOnly) {
    return initial?.trim() ? (
      <span className="text-muted-foreground text-sm">
        Trigramme : <span className="font-mono font-medium text-foreground">{initial}</span>
      </span>
    ) : null;
  }

  async function commit() {
    const v = normalizeTrigramme(value);
    setValue(v);
    if (v === (initial ?? "")) return;
    setSaving(true);
    const result = await saveProcessusCodeAction(id, v);
    setSaving(false);
    if (result.ok) {
      toast.success(v ? `Trigramme « ${v} » enregistré.` : "Trigramme retiré.");
      router.refresh();
    } else {
      toast.error(result.error);
      setValue(initial ?? "");
    }
  }

  const vide = !value.trim();

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <label htmlFor="processus-code" className="font-medium text-foreground">
        Trigramme
      </label>
      <Input
        id="processus-code"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="ex. SMQ"
        maxLength={6}
        disabled={saving}
        title="Code court du processus (ex. SMQ, DIR, RH) utilisé pour référencer ses documents."
        className={`h-7 w-24 font-mono uppercase ${vide ? "border-status-pa ring-1 ring-status-pa/40" : ""}`}
      />
      <span className="text-muted-foreground text-xs">
        {vide
          ? "À renseigner pour générer les codes des documents (ex. PR_SMQ_001)."
          : "Code court du processus, utilisé dans les références documentaires."}
      </span>
    </span>
  );
}
