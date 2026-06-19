"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUIVI_CONSULTANT_CHAMPS } from "@/lib/suivi-consultant";

export type ConsultantExportRow = {
  alerte: boolean;
  reponses: Record<string, unknown> | null;
};

function fmt(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(String).join(" | ");
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  return String(v);
}

const COLUMNS: { header: string; key: string }[] = [];
for (const c of SUIVI_CONSULTANT_CHAMPS) {
  COLUMNS.push({ header: c.label, key: c.key });
  if (c.type === "multi" && c.allowAutre) {
    COLUMNS.push({ header: `${c.label} (autre)`, key: `${c.key}_autre` });
  }
}

function csv(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function ExportButton({ rows }: { rows: ConsultantExportRow[] }) {
  function exportCsv() {
    const header = [...COLUMNS.map((c) => c.header), "Alerte santé/RPS"];
    const lines = rows.map((row) => {
      const r = row.reponses ?? {};
      const cells = COLUMNS.map((c) => csv(fmt(r[c.key])));
      cells.push(csv(row.alerte ? "Oui" : "Non"));
      return cells.join(";");
    });
    const content = `﻿${header.map(csv).join(";")}\n${lines.join("\n")}`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suivis-consultant.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={rows.length === 0}>
      <Download className="size-4" />
      Exporter (Excel)
    </Button>
  );
}
