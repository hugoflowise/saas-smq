/** Formatage et utilitaires de dates partagés (locale FR). */

/**
 * Fuseau horaire de référence de l'application (France).
 * Indispensable : le rendu serveur (Vercel/Node) tourne en UTC. Sans ce fuseau
 * explicite, toutes les heures s'affichent avec 2h (été) / 1h (hiver) de retard.
 * On le passe à chaque formatage de date/heure de l'app.
 */
export const TIMEZONE = "Europe/Paris";

/** Date courte « jj/mm/aaaa ». Renvoie « - » si la valeur est absente. */
export function formatDate(d: string | null | undefined): string {
  return d ? new Date(d).toLocaleDateString("fr-FR", { timeZone: TIMEZONE }) : "-";
}

/** Date + heure « jj/mm/aaaa à hh:mm ». Renvoie « - » si la valeur est absente. */
export function formatDateTime(d: string | null | undefined): string {
  if (!d) return "-";
  const date = new Date(d);
  const heure = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
  return `${date.toLocaleDateString("fr-FR", { timeZone: TIMEZONE })} à ${heure}`;
}

/**
 * Date ISO courte (AAAA-MM-JJ) d'un instant, exprimée dans le fuseau de l'app.
 * `en-CA` produit nativement le format AAAA-MM-JJ ; le `timeZone` garantit le bon
 * jour même quand le serveur est en UTC (sinon, avant 2h du matin, on obtenait la veille).
 */
function isoDateInTimezone(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
}

/**
 * Date du jour au format ISO court (AAAA-MM-JJ), dans le fuseau de l'app.
 * Pratique pour comparer aux colonnes `date` de Postgres (même format).
 */
export function todayISO(): string {
  return isoDateInTimezone(Date.now());
}

/**
 * Date décalée de `jours` par rapport à aujourd'hui (positif = futur, négatif = passé),
 * au format ISO court (AAAA-MM-JJ). Ex. `dateOffsetISO(60)` = dans 60 jours.
 */
export function dateOffsetISO(jours: number): string {
  return isoDateInTimezone(Date.now() + jours * 86_400_000);
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
