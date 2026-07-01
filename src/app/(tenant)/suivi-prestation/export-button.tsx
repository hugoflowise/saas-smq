"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Champ } from "@/lib/suivi-consultant";

export type SuiviExportRow = {
  est_reclamation: boolean;
  reponses: Record<string, unknown> | null;
};

function fmt(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(String).join(" | ");
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  return String(v);
}

/**
 * Colonnes de l'export, dérivées de la définition du formulaire du client.
 * Une matrice génère une colonne par ligne (`champ.key.ligne.key`), et un
 * choix multiple avec « Autre » ajoute une colonne libre.
 */
function buildColumns(champs: Champ[]): { header: string; key: string; matrice?: string }[] {
  const columns: { header: string; key: string; matrice?: string }[] = [];
  for (const c of champs) {
    if (c.type === "matrice") {
      for (const ligne of c.lignes ?? []) {
        columns.push({ header: ligne.label, key: ligne.key, matrice: c.key });
      }
      continue;
    }
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

export function ExportButton({ rows, champs }: { rows: SuiviExportRow[]; champs: Champ[] }) {
  function exportCsv() {
    const columns = buildColumns(champs);
    const header = [...columns.map((c) => c.header), "Réclamation"];
    const lines = rows.map((row) => {
      const r = row.reponses ?? {};
      const cells = columns.map((c) => {
        if (c.matrice) {
          const m = (r[c.matrice] ?? {}) as Record<string, unknown>;
          return csv(fmt(m[c.key]));
        }
        return csv(fmt(r[c.key]));
      });
      cells.push(csv(row.est_reclamation ? "Oui" : "Non"));
      return cells.join(";");
    });
    const content = `﻿${header.map(csv).join(";")}\n${lines.join("\n")}`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suivis-prestation.csv";
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
