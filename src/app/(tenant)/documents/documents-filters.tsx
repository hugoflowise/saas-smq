"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DOC_STATUT_LABELS } from "@/lib/documents";

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DocumentsFilters({
  types,
  type,
  statut,
}: {
  types: { value: string; label: string }[];
  type: string | null;
  statut: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/documents${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={SELECT_CLASS}
        value={type ?? ""}
        onChange={(e) => setParam("type", e.target.value)}
        aria-label="Filtrer par type"
      >
        <option value="">Tous les types</option>
        {types.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={statut ?? ""}
        onChange={(e) => setParam("statut", e.target.value)}
        aria-label="Filtrer par statut"
      >
        <option value="">Tous les statuts</option>
        {Object.entries(DOC_STATUT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {type || statut ? (
        <button
          type="button"
          onClick={() => router.push("/documents")}
          className="text-muted-foreground text-sm underline-offset-2 hover:text-foreground hover:underline"
        >
          Réinitialiser
        </button>
      ) : null}
    </div>
  );
}
