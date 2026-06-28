"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { quickUpdateRoStatutAction } from "@/lib/actions/risques";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { RO_STATUT_LABELS as STATUT_LABELS } from "@/lib/labels";

const CONTROL =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

export function RoStatutCell({ id, value }: { id: string; value: string }) {
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateRoStatutAction({ id, statut: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value);
      }
    });
  }

  // Lecture seule : affichage statique du libellé courant, sans select.
  if (readOnly) {
    return (
      <span className="text-sm">{STATUT_LABELS[val as keyof typeof STATUT_LABELS] ?? val}</span>
    );
  }

  return (
    <select
      value={val}
      onChange={onChange}
      disabled={pending}
      className={CONTROL}
      aria-label="Statut"
    >
      {Object.entries(STATUT_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
