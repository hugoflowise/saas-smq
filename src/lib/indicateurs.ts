/** Utilitaires indicateurs : sens de l'objectif et alerte "hors cible". */

export const FREQUENCE_LABELS: Record<string, string> = {
  quotidien: "Quotidienne",
  hebdo: "Hebdomadaire",
  mensuel: "Mensuelle",
  trimestriel: "Trimestrielle",
  annuel: "Annuelle",
};

/** Symbole affiché devant la cible selon le sens (≥ pour hausse, ≤ pour baisse). */
export const SENS_SYMBOLE: Record<string, string> = {
  hausse: "≥",
  baisse: "≤",
};

export const SENS_LABEL: Record<string, string> = {
  hausse: "À atteindre ou dépasser (≥ cible)",
  baisse: "À ne pas dépasser (≤ cible)",
};

/**
 * Vrai si la dernière valeur est hors cible compte tenu du sens :
 * "hausse" (≥ cible souhaité) alerte si valeur < cible ;
 * "baisse" (≤ cible souhaité) alerte si valeur > cible.
 */
export function horsCible(valeur: number, cible: number | null, sens: string): boolean {
  if (cible === null) return false;
  return sens === "baisse" ? valeur > cible : valeur < cible;
}

/** Cible formatée avec son symbole et son unité (ex. « ≥ 80 % »). */
export function cibleAffichee(cible: number | null, sens: string, unite: string | null): string {
  if (cible === null) return "-";
  const symbole = SENS_SYMBOLE[sens] ?? "";
  return `${symbole} ${cible}${unite ? ` ${unite}` : ""}`.trim();
}
