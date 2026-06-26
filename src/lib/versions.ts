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
