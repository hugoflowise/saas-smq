"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SuiviRow = {
  date_suivi: string | null;
  client: string | null;
  consultant: string | null;
  mission: string | null;
  manager: string | null;
  satisfaction_globale: number | null;
  nps: number | null;
  est_reclamation: boolean;
  nouvelle_date_suivi: string | null;
};

function cell(v: string | number | null): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function ExportButton({ rows }: { rows: SuiviRow[] }) {
  function exportCsv() {
    const header = [
      "Date",
      "Client",
      "Consultant",
      "Mission",
      "Manager",
      "Satisfaction (/5)",
      "NPS (0-10)",
      "Réclamation",
      "Prochaine date de suivi",
    ];
    const lines = rows.map((r) =>
      [
        cell(r.date_suivi),
        cell(r.client),
        cell(r.consultant),
        cell(r.mission),
        cell(r.manager),
        cell(r.satisfaction_globale),
        cell(r.nps),
        cell(r.est_reclamation ? "Oui" : "Non"),
        cell(r.nouvelle_date_suivi),
      ].join(";"),
    );
    const csv = `﻿${header.join(";")}\n${lines.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
