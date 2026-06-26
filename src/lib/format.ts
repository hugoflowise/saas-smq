/** Formatage et utilitaires de dates partagés (locale FR). */

/** Date courte « jj/mm/aaaa ». Renvoie « - » si la valeur est absente. */
export function formatDate(d: string | null | undefined): string {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "-";
}

/** Date + heure « jj/mm/aaaa à hh:mm ». Renvoie « - » si la valeur est absente. */
export function formatDateTime(d: string | null | undefined): string {
  if (!d) return "-";
  const date = new Date(d);
  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${date.toLocaleDateString("fr-FR")} à ${heure}`;
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

/**
 * Nom lisible d'une personne pour les documents : « Prénom Nom » si renseigné,
 * sinon déduit depuis l'e-mail (ex. « hugo.piovesan@… » devient « Hugo Piovesan »).
 * On n'affiche jamais l'adresse e-mail brute sur un document partagé.
 */
export function nomPersonne(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string {
  if (fullName?.trim()) return fullName.trim();
  const local = (email ?? "").split("@")[0] ?? "";
  if (!local) return "-";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join(" ");
}
