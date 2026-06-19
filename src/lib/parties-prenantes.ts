/** Cotation de saillance des parties prenantes (modèle Pouvoir/Légitimité/Urgence). */

export const SPHERE_LABELS: Record<string, string> = {
  interne: "Interne",
  externe: "Externe",
};

export const INTERACTION_LABELS: Record<string, string> = {
  faible: "Faible",
  moyenne: "Moyenne",
  forte: "Forte",
  elevee: "Élevée",
};

/** Poids des trois critères (repris du registre Fortil). */
export const POIDS = { pouvoir: 1, legitimite: 0.5, urgence: 0.25 } as const;

/** Total de saillance = Pouvoir×1 + Légitimité×0,5 + Urgence×0,25 (chaque critère 1 à 3). */
export function scoreTotal(pouvoir: number, legitimite: number, urgence: number): number {
  const t = pouvoir * POIDS.pouvoir + legitimite * POIDS.legitimite + urgence * POIDS.urgence;
  return Math.round(t * 100) / 100;
}

/** Niveau de priorité (1 basse, 2 moyenne, 3 haute) déduit du total. */
export function prioriteFromTotal(total: number): 1 | 2 | 3 {
  if (total >= 4) return 3;
  if (total >= 2.5) return 2;
  return 1;
}

export const PRIORITE_LABELS: Record<number, string> = {
  1: "Basse",
  2: "Moyenne",
  3: "Haute",
};

export const PRIORITE_CLASS: Record<number, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-status-pa/15 text-status-pa",
  3: "bg-status-nc-mineure/15 text-status-nc-mineure",
};

/** Coefficient de maîtrise : plus la maîtrise est faible, plus la criticité résiduelle est élevée. */
export const MAITRISE_COEFF: Record<string, number> = {
  maitrise: 0.25,
  partiel: 0.5,
  non_maitrise: 1,
};

export const MAITRISE_LABELS: Record<string, string> = {
  maitrise: "Maîtrisé",
  partiel: "Partiel",
  non_maitrise: "Non maîtrisé",
};

/** Criticité résiduelle = priorité × coefficient de maîtrise. */
export function criticiteResiduelle(priorite: number, maitrise: string): number {
  const coeff = MAITRISE_COEFF[maitrise] ?? 0.5;
  return Math.round(priorite * coeff * 100) / 100;
}

/** Classe couleur d'une criticité résiduelle (seuils indicatifs). */
export function criticiteClass(c: number): string {
  if (c >= 1.5) return "text-status-nc-majeure";
  if (c >= 0.75) return "text-status-pa";
  return "text-status-conforme";
}
