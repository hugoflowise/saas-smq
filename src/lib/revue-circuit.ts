// ============================================================================
// Verrou de complétude de la revue de direction (ISO 9001 §9.3).
// On ne peut ni vérifier ni approuver une revue tant que les 6 éléments
// d'entrée (a→f, §9.3.2) et les 3 éléments de sortie (§9.3.3) ne sont pas
// renseignés. Logique pure (testable) : ne dépend pas de Supabase.
// ============================================================================

/** Sous-ensemble des champs d'une revue nécessaires au contrôle de complétude. */
export type RevueChamps = {
  entree_actions_anterieures: string | null;
  entree_evolution_contexte: string | null;
  entree_performance_synthese: string | null;
  entree_ressources: string | null;
  entree_efficacite_actions: string | null;
  entree_opportunites: string | null;
  sortie_amelioration: string | null;
  sortie_changements: string | null;
  sortie_ressources: string | null;
};

/** Rubriques obligatoires, dans l'ordre du compte rendu, avec leur libellé. */
const RUBRIQUES_OBLIGATOIRES: { champ: keyof RevueChamps; label: string }[] = [
  { champ: "entree_actions_anterieures", label: "a) Suivi des actions des revues précédentes" },
  { champ: "entree_evolution_contexte", label: "b) Évolutions des enjeux internes et externes" },
  { champ: "entree_performance_synthese", label: "c) Synthèse de la performance du SMQ" },
  { champ: "entree_ressources", label: "d) Adéquation des ressources" },
  {
    champ: "entree_efficacite_actions",
    label: "e) Efficacité des actions face aux risques et opportunités",
  },
  { champ: "entree_opportunites", label: "f) Opportunités d'amélioration" },
  { champ: "sortie_amelioration", label: "Sortie — Décisions et actions d'amélioration" },
  { champ: "sortie_changements", label: "Sortie — Besoins de changement du SMQ" },
  { champ: "sortie_ressources", label: "Sortie — Besoins en ressources" },
];

/**
 * Vérifie qu'une revue est « complète » : chaque rubrique obligatoire doit
 * contenir du texte (après `trim`). Renvoie la liste des rubriques manquantes
 * (vide si tout est rempli).
 */
export function revueComplete(revue: RevueChamps): { complete: boolean; manquants: string[] } {
  const manquants = RUBRIQUES_OBLIGATOIRES.filter(({ champ }) => !(revue[champ] ?? "").trim()).map(
    ({ label }) => label,
  );
  return { complete: manquants.length === 0, manquants };
}

/** Message d'erreur FR listant les rubriques manquantes (pour les server actions). */
export function messageRevueIncomplete(manquants: string[]): string {
  return `Revue incomplète : renseignez d'abord ${manquants.length === 1 ? "la rubrique" : "les rubriques"} suivante${
    manquants.length === 1 ? "" : "s"
  } — ${manquants.join(" ; ")}.`;
}
