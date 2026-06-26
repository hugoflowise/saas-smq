"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  quickUpdateDocumentMaitriseAction,
  quickUpdateRevisionAction,
} from "@/lib/actions/documents-maitrise";
import { formatDate, todayISO } from "@/lib/format";
import { useReadOnly } from "@/lib/hooks/read-only-context";

const REVISION_ALERTE_JOURS = 60;
const CONTROL =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

export type RevisionSource = "politique" | "procedure" | "processus" | "registre";

/** Date de révision prévue éditable directement dans la liste maîtresse (toutes sources). */
export function DocRevisionCell({
  source,
  id,
  value,
}: {
  source: RevisionSource;
  id: string;
  value: string | null;
}) {
  const [val, setVal] = useState(value ?? "");
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function save(next: string) {
    setVal(next);
    startTransition(async () => {
      const r = await quickUpdateRevisionAction({ source, id, date: next });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value ?? "");
      }
    });
  }

  const today = todayISO();
  const alerte = new Date(Date.now() + REVISION_ALERTE_JOURS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const enRetard = val && val < today;
  const bientot = val && !enRetard && val <= alerte;

  if (readOnly) {
    return <span className="text-sm">{val ? formatDate(val) : "-"}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <input
        type="date"
        value={val}
        disabled={pending}
        onChange={(e) => save(e.target.value)}
        className={CONTROL}
        aria-label="Révision prévue"
      />
      {enRetard ? (
        <span className="font-medium text-status-nc-mineure text-xs">en retard</span>
      ) : bientot ? (
        <span className="font-medium text-status-pa text-xs">bientôt</span>
      ) : null}
    </div>
  );
}

/** Durée de stockage éditable directement dans la liste maîtresse. */
export function DocDureeCell({ id, value }: { id: string; value: string | null }) {
  const [val, setVal] = useState(value ?? "");
  const [pending, startTransition] = useTransition();
  const readOnly = useReadOnly();

  function commit() {
    if (val === (value ?? "")) return; // pas de changement → pas d'appel
    startTransition(async () => {
      const r = await quickUpdateDocumentMaitriseAction({ id, dureeConservation: val });
      if (!r.ok) {
        toast.error(r.error);
        setVal(value ?? "");
      }
    });
  }

  if (readOnly) {
    return <span className="text-sm">{val || "-"}</span>;
  }

  return (
    <input
      value={val}
      disabled={pending}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      placeholder="ex. 3 ans"
      className={CONTROL}
      aria-label="Durée de stockage"
    />
  );
}
