/**
 * Critères d'évaluation des prestataires externes (ISO 9001 §8.4.1).
 *
 * Grille explicite et stable, partagée par le formulaire d'évaluation et
 * l'affichage de l'historique. Conservée en constante (et non en table) : ce
 * référentiel est commun à tous les tenants et change rarement ; les notes
 * saisies sont stockées par clé dans `fournisseur_evaluations.notes_criteres`.
 */

export type CritereFournisseur = {
  /** Clé technique stockée dans le jsonb `notes_criteres`. */
  cle: string;
  /** Libellé affiché. */
  label: string;
};

export const CRITERES_FOURNISSEUR: readonly CritereFournisseur[] = [
  { cle: "qualite", label: "Qualité des prestations / produits" },
  { cle: "delai", label: "Respect des délais" },
  { cle: "prix", label: "Prix / compétitivité" },
  { cle: "reactivite", label: "Réactivité / communication" },
  { cle: "conformite", label: "Conformité documentaire" },
] as const;

/** Notes par critère : clé du critère → note de 1 à 5. */
export type NotesCriteres = Record<string, number>;

/**
 * Moyenne des notes par critère, arrondie à l'entier (échelle 1-5), ou `null`
 * si aucune note. Sert à pré-calculer une note globale suggérée.
 */
export function moyenneCriteres(notes: NotesCriteres): number | null {
  const valeurs = Object.values(notes).filter((n) => Number.isFinite(n) && n > 0);
  if (valeurs.length === 0) return null;
  return Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length);
}
