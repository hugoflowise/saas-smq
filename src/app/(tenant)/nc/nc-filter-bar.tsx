"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NC_GRAVITE_LABELS, NC_STATUT_LABELS } from "@/lib/labels";
import { SELECT_CLASS_FILTER as SELECT_CLASS } from "@/lib/ui-classes";

export function NcFilterBar() {
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
        {Object.entries(NC_STATUT_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select
        className={SELECT_CLASS}
        value={params.get("gravite") ?? ""}
        onChange={(e) => update("gravite", e.target.value)}
      >
        <option value="">Toutes les gravités</option>
        {Object.entries(NC_GRAVITE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
