/** Calcul de la progression d'un objectif (0-100) selon le sens visé. */
export function objectifProgress(
  actuelle: number | null,
  cible: number | null,
  sens: string | null,
): number | null {
  if (actuelle == null || cible == null) return null;
  let pct: number;
  if (sens === "baisse") {
    // Cible = ne pas dépasser. Atteint si on est en dessous.
    if (actuelle <= cible) pct = 100;
    else if (actuelle === 0) pct = 0;
    else pct = (cible / actuelle) * 100;
  } else {
    // Hausse : atteindre la cible en montant.
    if (cible === 0) pct = actuelle >= 0 ? 100 : 0;
    else pct = (actuelle / cible) * 100;
  }
  return Math.max(0, Math.min(100, Math.round(pct)));
}
