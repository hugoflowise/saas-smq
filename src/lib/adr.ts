// Helpers de l'analyse de risques par mission (MASE Axe 3).

export const ADR_STATUTS = ["brouillon", "validee", "a_reviser", "archivee"] as const;
export type AdrStatut = (typeof ADR_STATUTS)[number];

export const ADR_STATUT_LABELS: Record<AdrStatut, string> = {
  brouillon: "Brouillon",
  validee: "Validée",
  a_reviser: "À réviser",
  archivee: "Archivée",
};

export const ADR_STATUT_CLASS: Record<AdrStatut, string> = {
  brouillon: "bg-muted text-muted-foreground",
  validee: "bg-status-conforme/15 text-status-conforme",
  a_reviser: "bg-status-pa/15 text-status-pa",
  archivee: "bg-muted text-muted-foreground",
};

/** Cotation gravité (1-4) × probabilité (1-4) → criticité 1-16. */
export function niveauCriticite(criticite: number): "faible" | "moyen" | "eleve" {
  if (criticite >= 9) return "eleve";
  if (criticite >= 4) return "moyen";
  return "faible";
}

export function criticiteClass(criticite: number): string {
  const n = niveauCriticite(criticite);
  if (n === "eleve") return "bg-status-nc-majeure/15 text-status-nc-majeure";
  if (n === "moyen") return "bg-status-pa/15 text-status-pa";
  return "bg-status-conforme/15 text-status-conforme";
}
