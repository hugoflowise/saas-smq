"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SATISFACTION_AXES } from "@/lib/suivi-prestation";

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

// Colonnes de l'export : tous les champs du formulaire.
const COLUMNS: { header: string; key: string }[] = [
  { header: "Date du suivi", key: "date_suivi" },
  { header: "Consultant", key: "consultant" },
  { header: "Client", key: "client" },
  { header: "Mission", key: "mission" },
  { header: "Manager", key: "manager" },
  { header: "Réalisations passées", key: "realisations_passees" },
  { header: "Réalisations à venir", key: "realisations_a_venir" },
  { header: "Périmètre évolué", key: "perimetre_evolue" },
  { header: "Écarts (si oui)", key: "ecarts_details" },
  ...SATISFACTION_AXES.map((a) => ({ header: `Satisf. ${a.label}`, key: `axe_${a.key}` })),
  { header: "Points forts", key: "points_forts" },
  { header: "Points forts (autre)", key: "points_forts_autre" },
  { header: "Axes d'amélioration", key: "axes_amelioration" },
  { header: "Axes d'amélioration (autre)", key: "axes_amelioration_autre" },
  { header: "Commentaire bilan", key: "commentaire_bilan" },
  { header: "QSSE - consignes", key: "securite_consignes" },
  { header: "QSSE - EPI", key: "securite_epi" },
  { header: "QSSE - plan de prévention", key: "plan_prevention" },
  { header: "Satisfaction globale (/5)", key: "satisfaction_globale" },
  { header: "NPS (0-10)", key: "nps" },
  { header: "Commentaire satisfaction", key: "commentaire_satisfaction" },
  { header: "Futurs besoins", key: "besoins_futurs" },
  { header: "Futurs besoins (autre)", key: "besoins_futurs_autre" },
  { header: "Améliorations proposées", key: "amelioration_prestations" },
  { header: "Actions à prévoir", key: "plan_actions" },
  { header: "Actions (autre)", key: "plan_actions_autre" },
  { header: "Délais des actions", key: "delais_actions" },
  { header: "Nouvelle date de suivi", key: "nouvelle_date_suivi" },
  { header: "Commentaire plan", key: "commentaire_plan" },
  { header: "Représentant client", key: "nom_representant" },
  { header: "E-mail représentant", key: "mail_representant" },
];

function csv(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function ExportButton({ rows }: { rows: SuiviExportRow[] }) {
  function exportCsv() {
    const header = [...COLUMNS.map((c) => c.header), "Réclamation"];
    const lines = rows.map((row) => {
      const r = row.reponses ?? {};
      const axes = (r.satisfaction_axes ?? {}) as Record<string, unknown>;
      const cells = COLUMNS.map((c) => {
        if (c.key.startsWith("axe_")) return csv(fmt(axes[c.key.slice(4)]));
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
