/** Configuration du formulaire « Suivi de prestation client ». */

export const SATISFACTION_AXES: { key: string; label: string }[] = [
  { key: "coherence_attentes", label: "Cohérence entre le niveau de prestation et vos attentes" },
  { key: "implication", label: "Implication dans la mission" },
  { key: "professionnalisme", label: "Professionnalisme et ponctualité" },
  { key: "respect_delais", label: "Respect des délais et des engagements" },
  { key: "capacite_adaptation", label: "Capacité d'adaptation" },
  { key: "qualite_travail", label: "Qualité du travail" },
];

export const AXE_NOTE_LABELS: Record<number, string> = {
  1: "Très insatisfait",
  2: "Insatisfait",
  3: "Satisfait",
  4: "Très satisfait",
};

export const BILAN_OPTIONS = [
  "Compétences techniques",
  "Qualité du travail",
  "Respect des délais et des engagements",
  "Autonomie et fiabilité",
  "Implication dans la mission",
  "Professionnalisme et ponctualité",
  "Capacité d'adaptation",
  "Communication et reporting",
  "Intégration dans l'équipe / savoir-être",
  "Force de proposition",
];

export const BESOINS_OPTIONS = [
  "Prolongation de la mission en cours",
  "Nouveau besoin / autre poste à pourvoir",
  "Renfort / montée en charge sur la mission",
  "Besoin de formation",
  "Aucun besoin identifié pour l'instant",
];

export const PLAN_ACTIONS_OPTIONS = [
  "RàS - Poursuite de la mission",
  "Formation collaborateur",
  "Achat d'EPI",
  "Sensibilisation (qualité, risques, …)",
];

export const QSSE_FIELDS: { key: string; label: string }[] = [
  { key: "securite_consignes", label: "Respect des consignes de sécurité" },
  { key: "securite_epi", label: "Respect du port des équipements de protection obligatoires" },
  { key: "plan_prevention", label: "Plan de prévention signé et disponible" },
];

export const OUI_NON_SO = ["Oui", "Non", "Sans objet"] as const;
