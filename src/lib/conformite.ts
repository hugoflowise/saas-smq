/**
 * Péremption des cotations de conformité ISO.
 *
 * Une conformité n'est pas acquise pour toujours : au-delà d'un certain délai
 * sans réévaluation, l'élément doit être revérifié. On ne le bascule PAS en
 * « non conforme » (périmé ≠ non conforme), on le signale « à réévaluer ».
 */

/** Délai de validité par défaut d'une cotation, en mois (aligné sur le cycle d'audit interne). */
export const MOIS_VALIDITE_CONFORMITE = 12;

/**
 * Date limite (ISO AAAA-MM-JJ) : une évaluation antérieure à cette date est périmée.
 * @param today date du jour au format ISO ;
 * @param mois  délai de validité (défaut {@link MOIS_VALIDITE_CONFORMITE}).
 */
export function dateLimiteReevaluation(today: string, mois = MOIS_VALIDITE_CONFORMITE): string {
  const d = new Date(today);
  d.setMonth(d.getMonth() - mois);
  return d.toISOString().slice(0, 10);
}

/**
 * Date à laquelle une cotation devra être réévaluée : date d'évaluation + délai.
 * Renvoie null si l'élément n'a jamais été évalué.
 */
export function dateProchaineReevaluation(
  dateEvaluation: string | null,
  mois = MOIS_VALIDITE_CONFORMITE,
): string | null {
  if (!dateEvaluation) return null;
  const d = new Date(dateEvaluation);
  d.setMonth(d.getMonth() + mois);
  return d.toISOString().slice(0, 10);
}

/**
 * Une cotation « validée » (conforme ou point fort) dont l'évaluation est plus
 * ancienne que la date limite doit être réévaluée. Les autres cotations
 * (non évaluées, points d'attention, non-conformités) ne sont jamais concernées.
 */
export function estAReevaluer(
  cotation: string,
  dateEvaluation: string | null,
  dateLimite: string,
): boolean {
  if (cotation !== "conforme" && cotation !== "point_fort") return false;
  if (!dateEvaluation) return false;
  return dateEvaluation < dateLimite;
}
