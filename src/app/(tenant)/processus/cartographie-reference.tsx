"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { saveCartographieReferenceAction } from "@/lib/actions/cartographie";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/**
 * Référence documentaire de la cartographie (codification client, ex. DG_SMQ_001).
 * Éditable en ligne par un rédacteur ; simple affichage en lecture seule.
 */
export function CartographieReference({ initial }: { initial: string | null }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  if (readOnly) {
    return initial?.trim() ? (
      <span>
        Référence : <span className="font-medium text-foreground">{initial}</span>
      </span>
    ) : null;
  }

  async function commit() {
    const v = value.trim();
    if (v === (initial ?? "")) return;
    setSaving(true);
    const result = await saveCartographieReferenceAction(v);
    setSaving(false);
    if (result.ok) {
      toast.success("Référence enregistrée.");
      router.refresh();
    } else {
      toast.error(result.error);
      setValue(initial ?? "");
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <label htmlFor="carto-reference" className="font-medium">
        Référence
      </label>
      <Input
        id="carto-reference"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="ex. DG_SMQ_001"
        disabled={saving}
        className="h-7 w-40"
      />
    </span>
  );
}
