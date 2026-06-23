"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { quickUpdateObjectifAction } from "@/lib/actions/registres";
import { formatDate } from "@/lib/format";
import { useReadOnly } from "@/lib/hooks/read-only-context";

const CONTROL =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

const STATUT_OPTIONS: Record<string, string> = {
  actif: "Actif",
  atteint: "Atteint",
  abandonne: "Abandonné",
};

export function ObjStatutCell({ id, value }: { id: string; value: string }) {
  const [val, setVal] = useState(value);
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateObjectifAction({ id, statut: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value);
      }
    });
  }

  // Lecture seule : affichage statique du libellé courant, sans select.
  if (readOnly) {
    return <span className="text-sm">{STATUT_OPTIONS[val] ?? val}</span>;
  }

  return (
    <select
      value={val}
      onChange={onChange}
      disabled={pending}
      className={CONTROL}
      aria-label="Statut"
    >
      {Object.entries(STATUT_OPTIONS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function ObjEcheanceCell({ id, value }: { id: string; value: string | null }) {
  const [val, setVal] = useState(value ?? "");
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateObjectifAction({ id, echeance: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value ?? "");
      }
    });
  }

  // Lecture seule : affichage statique de l'échéance, sans champ de saisie.
  if (readOnly) {
    return <span className="text-sm">{val ? formatDate(val) : "-"}</span>;
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

/** Valeur actuelle éditable (met à jour la barre de progression au blur). */
export function ObjValeurActuelleCell({
  id,
  value,
  unite,
}: {
  id: string;
  value: number | null;
  unite: string | null;
}) {
  const [val, setVal] = useState(value ?? "");
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function commit() {
    if (String(val) === String(value ?? "")) return;
    startTransition(async () => {
      const r = await quickUpdateObjectifAction({
        id,
        valeurActuelle: val === "" ? undefined : val,
      });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value ?? "");
      }
    });
  }

  // Lecture seule : affichage statique de la valeur courante, sans champ de saisie.
  if (readOnly) {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        {val === "" ? "-" : val}
        {unite ? <span className="text-muted-foreground text-xs">{unite}</span> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        step="any"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        disabled={pending}
        className={`${CONTROL} w-20`}
        aria-label="Valeur actuelle"
        placeholder="actuelle"
      />
      {unite ? <span className="text-muted-foreground text-xs">{unite}</span> : null}
    </span>
  );
}
