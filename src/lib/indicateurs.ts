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
 * Une cible en texte libre (cibleTexte) désactive l'alerte automatique : la
 * comparaison numérique n'a pas de sens sur une cible descriptive.
 */
export function horsCible(
  valeur: number,
  cible: number | null,
  sens: string,
  cibleTexte?: string | null,
): boolean {
  if (cibleTexte?.trim()) return false;
  if (cible === null) return false;
  return sens === "baisse" ? valeur > cible : valeur < cible;
}

/**
 * Cible formatée. Si une cible en texte libre est renseignée, elle prime et est
 * affichée telle quelle ; sinon on formate la cible chiffrée avec son symbole et
 * son unité (ex. « ≥ 80 % »).
 */
export function cibleAffichee(
  cible: number | null,
  sens: string,
  unite: string | null,
  cibleTexte?: string | null,
): string {
  if (cibleTexte?.trim()) return cibleTexte.trim();
  if (cible === null) return "-";
  const symbole = SENS_SYMBOLE[sens] ?? "";
  return `${symbole} ${cible}${unite ? ` ${unite}` : ""}`.trim();
}
