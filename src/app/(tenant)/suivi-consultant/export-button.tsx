"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Champ } from "@/lib/suivi-consultant";

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

/** Colonnes de l'export, dérivées de la définition du formulaire du client. */
function buildColumns(champs: Champ[]): { header: string; key: string }[] {
  const columns: { header: string; key: string }[] = [];
  for (const c of champs) {
    columns.push({ header: c.label, key: c.key });
    if (c.type === "multi" && c.allowAutre) {
      columns.push({ header: `${c.label} (autre)`, key: `${c.key}_autre` });
    }
  }
  return columns;
}

function csv(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function ExportButton({ rows, champs }: { rows: ConsultantExportRow[]; champs: Champ[] }) {
  function exportCsv() {
    const columns = buildColumns(champs);
    const header = [...columns.map((c) => c.header), "Alerte santé/RPS"];
    const lines = rows.map((row) => {
      const r = row.reponses ?? {};
      const cells = columns.map((c) => csv(fmt(r[c.key])));
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
