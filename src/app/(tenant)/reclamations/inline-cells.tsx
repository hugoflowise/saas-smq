"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { quickUpdateReclamationAction } from "@/lib/actions/registres";
import { GRAVITE_BADGE_CLASS } from "@/lib/badges";
import { NC_GRAVITE_LABELS } from "@/lib/labels";

const CONTROL =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

const STATUT_LABELS: Record<string, string> = {
  recue: "Reçue",
  analysee: "Analysée",
  traitee: "Traitée",
  cloturee: "Clôturée",
};

export function RecStatutCell({ id, value }: { id: string; value: string }) {
  const router = useRouter();
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateReclamationAction({ id, statut: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value);
      } else {
        router.refresh();
      }
    });
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
  const router = useRouter();
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateReclamationAction({ id, gravite: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value);
      } else {
        router.refresh();
      }
    });
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
