/**
 * Versionnage uniforme des documents maîtrisés : A, B, C, … Z, AA, AB…
 * La version est une lettre, attribuée à la publication. `index` = nombre de
 * versions déjà publiées (0 → A pour la première publication).
 */
export function versionLettre(index: number): string {
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

/**
 * Inverse de `versionLettre` : la lettre vers son index (A → 0, B → 1, … AA → 26).
 * Utile pour calculer la version suivante à partir des lettres déjà attribuées
 * (et non d'un simple compteur), afin d'éviter les collisions après suppression.
 */
export function versionIndex(lettre: string): number {
  let n = 0;
  for (const c of lettre.toUpperCase()) {
    n = n * 26 + (c.charCodeAt(0) - 64); // A = 1
  }
  return n - 1;
}
