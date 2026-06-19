"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ExportRow = {
  client: string | null;
  date_reponse: string;
  note_recommandation: number | null;
  note_satisfaction: number | null;
  est_reclamation: boolean;
  commentaire: string | null;
  source: string | null;
};

function csvCell(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function ExportButton({ rows }: { rows: ExportRow[] }) {
  function exportCsv() {
    const header = [
      "Client",
      "Date",
      "Recommandation (0-10)",
      "Satisfaction (/10)",
      "Réclamation",
      "Commentaire",
      "Source",
    ];
    const lines = rows.map((r) =>
      [
        csvCell(r.client),
        csvCell(r.date_reponse),
        csvCell(r.note_recommandation),
        csvCell(r.note_satisfaction),
        csvCell(r.est_reclamation ? "Oui" : "Non"),
        csvCell(r.commentaire),
        csvCell(r.source),
      ].join(";"),
    );
    // BOM pour qu'Excel ouvre l'UTF-8 correctement.
    const csv = `﻿${header.join(";")}\n${lines.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "satisfaction.csv";
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
