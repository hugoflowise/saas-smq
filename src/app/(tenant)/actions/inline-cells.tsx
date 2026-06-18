"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { quickUpdateActionAction } from "@/lib/actions/plan-actions";
import { COTATION_BADGE_CLASS } from "@/lib/badges";
import { ACTION_PRIORITE_LABELS, ACTION_STATUT_LABELS } from "@/lib/labels";

const COTATION_OPTIONS: Record<string, string> = {
  non_evalue: "Non évalué",
  conforme: "Conforme",
  point_attention: "Point d'attention",
  nc_mineure: "NC mineure",
  nc_majeure: "NC majeure",
};

const CONTROL =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

const STATUT_CLASS: Record<string, string> = {
  a_faire: "bg-muted text-foreground",
  en_cours: "bg-status-pf/15 text-status-pf",
  termine: "bg-status-conforme/15 text-status-conforme",
  bloquee: "bg-status-nc-mineure/15 text-status-nc-mineure",
  abandonnee: "bg-muted text-muted-foreground",
};

/** Sélecteur de statut éditable directement dans le tableau. */
export function StatutCell({ id, value }: { id: string; value: string }) {
  const router = useRouter();
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateActionAction({ id, statut: next });
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
      className={`${CONTROL} font-medium ${STATUT_CLASS[val] ?? ""}`}
      aria-label="Statut"
    >
      {Object.entries(ACTION_STATUT_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** Sélecteur de priorité éditable directement dans le tableau. */
export function PrioriteCell({ id, value }: { id: string; value: string }) {
  const router = useRouter();
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateActionAction({ id, priorite: next });
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
      aria-label="Priorité"
    >
      {Object.entries(ACTION_PRIORITE_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** Sélecteur de cotation éditable directement dans le tableau. */
export function CotationCell({ id, value }: { id: string; value: string | null }) {
  const router = useRouter();
  const [val, setVal] = useState(value ?? "non_evalue");
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateActionAction({ id, cotation: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value ?? "non_evalue");
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
      className={`${CONTROL} font-medium ${val !== "non_evalue" ? (COTATION_BADGE_CLASS[val] ?? "") : ""}`}
      aria-label="Cotation"
    >
      {Object.entries(COTATION_OPTIONS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** Champ d'échéance éditable directement dans le tableau. */
export function EcheanceCell({ id, value }: { id: string; value: string | null }) {
  const router = useRouter();
  const [val, setVal] = useState(value ?? "");
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateActionAction({ id, datePrevue: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value ?? "");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <input
      type="date"
      value={val}
      onChange={onChange}
      disabled={pending}
      className={CONTROL}
      aria-label="Échéance"
    />
  );
}
