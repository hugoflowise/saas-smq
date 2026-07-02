// Taux de fréquence (TF) et de gravité (TG) des accidents du travail (MASE).
// Indicateurs de résultat SSE, calculés sur une période (généralement l'année).

/**
 * Taux de fréquence : nombre d'accidents avec arrêt par million d'heures
 * travaillées. Renvoie null si les heures travaillées ne sont pas connues.
 */
export function tauxFrequence(accidentsAvecArret: number, heures: number): number | null {
  if (!heures || heures <= 0) return null;
  return Math.round(((accidentsAvecArret * 1_000_000) / heures) * 100) / 100;
}

/**
 * Taux de gravité : nombre de journées d'arrêt pour mille heures travaillées.
 * Renvoie null si les heures travaillées ne sont pas connues.
 */
export function tauxGravite(joursArret: number, heures: number): number | null {
  if (!heures || heures <= 0) return null;
  return Math.round(((joursArret * 1_000) / heures) * 100) / 100;
}

/** Affichage court d'un taux (ou tiret si non calculable). */
export function formatTaux(v: number | null): string {
  return v == null ? "-" : v.toLocaleString("fr-FR");
}
