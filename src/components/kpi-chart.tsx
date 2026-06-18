"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type KpiPoint = { date: string; valeur: number };

export function KpiChart({
  data,
  cible,
  unite,
}: {
  data: KpiPoint[];
  cible?: number | null;
  unite?: string | null;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Aucune valeur saisie pour l'instant.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="var(--muted-foreground)"
            width={40}
            unit={unite ?? ""}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          {typeof cible === "number" ? (
            <ReferenceLine
              y={cible}
              stroke="var(--color-status-conforme)"
              strokeDasharray="4 4"
              label={{ value: `Cible ${cible}`, fontSize: 11, position: "insideTopRight" }}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="valeur"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
