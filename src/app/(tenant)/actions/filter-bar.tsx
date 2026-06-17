"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ACTION_PRIORITE_LABELS, ACTION_STATUT_LABELS } from "@/lib/labels";

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <select
        className={SELECT_CLASS}
        value={params.get("statut") ?? ""}
        onChange={(e) => update("statut", e.target.value)}
      >
        <option value="">Tous les statuts</option>
        {Object.entries(ACTION_STATUT_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select
        className={SELECT_CLASS}
        value={params.get("priorite") ?? ""}
        onChange={(e) => update("priorite", e.target.value)}
      >
        <option value="">Toutes les priorités</option>
        {Object.entries(ACTION_PRIORITE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
