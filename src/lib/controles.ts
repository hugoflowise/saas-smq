// Helpers du registre des contrôles réglementaires obligatoires (MASE Axe 4).

export const CONTROLE_STATUTS = ["a_planifier", "conforme", "non_conforme"] as const;
export type ControleStatut = (typeof CONTROLE_STATUTS)[number];

export const CONTROLE_STATUT_LABELS: Record<ControleStatut, string> = {
  a_planifier: "À planifier",
  conforme: "Conforme",
  non_conforme: "Non conforme",
};

export const CONTROLE_STATUT_CLASS: Record<ControleStatut, string> = {
  a_planifier: "bg-muted text-muted-foreground",
  conforme: "bg-status-conforme/15 text-status-conforme",
  non_conforme: "bg-status-nc-majeure/15 text-status-nc-majeure",
};

/** Jours restants avant l'échéance (négatif si dépassée). */
export function joursAvantEcheance(dateProchain: string, today: string): number {
  const d = Date.parse(dateProchain);
  const t = Date.parse(today);
  if (Number.isNaN(d) || Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.round((d - t) / 86_400_000);
}
