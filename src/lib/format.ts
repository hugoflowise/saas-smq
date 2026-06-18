/** Formatage de dates partagé (locale FR). */

/** Date courte « jj/mm/aaaa ». Renvoie « — » si la valeur est absente. */
export function formatDate(d: string | null | undefined): string {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}
