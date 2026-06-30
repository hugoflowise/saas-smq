"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { quickUpdateRisqueAction } from "@/lib/actions/duerp";
import { DUERP_STATUT_LABELS } from "@/lib/duerp";
import { useReadOnly } from "@/lib/hooks/read-only-context";

const CONTROL =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";
const STATIC = "inline-flex h-8 items-center rounded-md border border-input px-2 text-sm";

export function RisqueStatutCell({ id, value }: { id: string; value: string }) {
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateRisqueAction({ id, statut: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value);
      }
    });
  }

  if (readOnly) return <span className={STATIC}>{DUERP_STATUT_LABELS[val] ?? val}</span>;

  return (
    <select
      value={val}
      onChange={onChange}
      disabled={pending}
      className={CONTROL}
      aria-label="Statut du risque"
    >
      {Object.entries(DUERP_STATUT_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
