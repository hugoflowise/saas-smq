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
 */
export function TrigrammeEditor({ id, initial }: { id: string; initial: string | null }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  if (readOnly) {
    return initial?.trim() ? (
      <span className="text-muted-foreground text-sm">
        Code : <span className="font-mono font-medium text-foreground">{initial}</span>
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
      toast.success("Trigramme enregistré.");
      router.refresh();
    } else {
      toast.error(result.error);
      setValue(initial ?? "");
    }
  }

  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
      <label htmlFor="processus-code" className="font-medium">
        Code
      </label>
      <Input
        id="processus-code"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="SMQ"
        maxLength={6}
        disabled={saving}
        className="h-7 w-24 font-mono"
      />
    </span>
  );
}
