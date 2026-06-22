/** Formatage et utilitaires de dates partagés (locale FR). */

/** Date courte « jj/mm/aaaa ». Renvoie « - » si la valeur est absente. */
export function formatDate(d: string | null | undefined): string {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "-";
}

/**
 * Date du jour au format ISO court (AAAA-MM-JJ).
 * Pratique pour comparer aux colonnes `date` de Postgres (même format).
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Date décalée de `jours` par rapport à aujourd'hui (positif = futur, négatif = passé),
 * au format ISO court (AAAA-MM-JJ). Ex. `dateOffsetISO(60)` = dans 60 jours.
 */
export function dateOffsetISO(jours: number): string {
  return new Date(Date.now() + jours * 86_400_000).toISOString().slice(0, 10);
}
