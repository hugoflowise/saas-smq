"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY } from "@/lib/journal";

const SELECT_CLASS =
  "h-9 rounded-lg border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";

export function JournalFilters({
  entity,
  action,
}: {
  entity: string | null;
  action: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/journal${next.toString() ? `?${next.toString()}` : ""}`);
  }

  const entities = Object.entries(AUDIT_ENTITY).sort((a, b) =>
    a[1].label.localeCompare(b[1].label, "fr"),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={SELECT_CLASS}
        value={entity ?? ""}
        onChange={(e) => setParam("entite", e.target.value)}
        aria-label="Filtrer par type"
      >
        <option value="">Tous les types</option>
        {entities.map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={action ?? ""}
        onChange={(e) => setParam("action", e.target.value)}
        aria-label="Filtrer par opération"
      >
        <option value="">Toutes les opérations</option>
        {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {entity || action ? (
        <button
          type="button"
          onClick={() => router.push("/journal")}
          className="text-muted-foreground text-sm underline-offset-2 hover:text-foreground hover:underline"
        >
          Réinitialiser
        </button>
      ) : null}
    </div>
  );
}
