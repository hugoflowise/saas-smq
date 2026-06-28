"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { quickUpdateReclamationAction } from "@/lib/actions/registres";
import { GRAVITE_BADGE_CLASS } from "@/lib/badges";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { NC_GRAVITE_LABELS, RECLAMATION_STATUT_LABELS as STATUT_LABELS } from "@/lib/labels";

const CONTROL =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

// Affichage statique (lecture seule auditeur) : même gabarit que le select mais inerte.
const STATIC = "inline-flex h-8 items-center rounded-md border border-input px-2 text-sm";

export function RecStatutCell({ id, value }: { id: string; value: string }) {
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateReclamationAction({ id, statut: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value);
      }
    });
  }

  if (readOnly) {
    return (
      <span className={STATIC}>{STATUT_LABELS[val as keyof typeof STATUT_LABELS] ?? val}</span>
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

export function RecGraviteCell({ id, value }: { id: string; value: string }) {
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateReclamationAction({ id, gravite: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value);
      }
    });
  }

  if (readOnly) {
    return (
      <span className={`${STATIC} font-medium ${GRAVITE_BADGE_CLASS[val] ?? ""}`}>
        {NC_GRAVITE_LABELS[val as keyof typeof NC_GRAVITE_LABELS] ?? val}
      </span>
    );
  }

  return (
    <select
      value={val}
      onChange={onChange}
      disabled={pending}
      className={`${CONTROL} font-medium ${GRAVITE_BADGE_CLASS[val] ?? ""}`}
      aria-label="Gravité"
    >
      {Object.entries(NC_GRAVITE_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
