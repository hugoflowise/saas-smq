/** Configuration du formulaire « Suivi de prestation client ». */

import type { SectionConfig } from "@/lib/suivi-consultant";

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

const OUI_NON = ["Oui", "Non"];

/**
 * Modèle par défaut du formulaire « Suivi de prestation client », reproduisant
 * fidèlement le formulaire codé en dur (mêmes sections, libellés et clés
 * `reponses`). Les champs socle (`verrou`) alimentent des colonnes dénormalisées
 * de `suivis_prestation` ou la logique de réclamation, et ne peuvent pas être
 * supprimés / retypés par le client.
 *
 * Note : la case « attestation sur l'honneur » (section 9) reste gérée en dur
 * dans le formulaire public : ce n'est pas une question mais une validation.
 */
export const SUIVI_PRESTATION_SECTIONS: SectionConfig[] = [
  {
    n: 1,
    title: "Contexte de la visite",
    champs: [
      {
        key: "consultant",
        label: "Consultant (Prénom NOM)",
        type: "text",
        required: true,
        verrou: true,
      },
      { key: "client", label: "Client / entité", type: "text", required: true, verrou: true },
      {
        key: "mission",
        label: "Mission / poste occupé",
        type: "text",
        required: true,
        verrou: true,
      },
      { key: "date_suivi", label: "Date du suivi", type: "date", required: true, verrou: true },
      { key: "manager", label: "Manager (Prénom NOM)", type: "text", required: true, verrou: true },
    ],
  },
  {
    n: 2,
    title: "Activité et périmètre",
    champs: [
      {
        key: "realisations_passees",
        label: "Réalisations passées (depuis le dernier point)",
        type: "textarea",
      },
      { key: "realisations_a_venir", label: "Réalisations à venir", type: "textarea" },
      {
        key: "perimetre_evolue",
        label: "Le périmètre de la mission a-t-il évolué par rapport au contrat signé ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "ecarts_details",
        label: "Si oui, lesquels ?",
        type: "textarea",
        showIf: { key: "perimetre_evolue", equals: "Oui" },
      },
    ],
  },
  {
    n: 3,
    title: "Satisfaction sur la prestation",
    champs: [
      {
        key: "satisfaction_axes",
        label: "Notez de 1 (très insatisfait) à 4 (très satisfait).",
        type: "matrice",
        required: true,
        lignes: SATISFACTION_AXES,
        echelle: { min: 1, max: 4, labels: AXE_NOTE_LABELS },
      },
    ],
  },
  {
    n: 4,
    title: "Bilan qualitatif",
    champs: [
      {
        key: "points_forts",
        label: "Points forts / succès",
        type: "multi",
        options: BILAN_OPTIONS,
        allowAutre: true,
        required: true,
      },
      {
        key: "axes_amelioration",
        label: "Axes d'amélioration / difficultés",
        type: "multi",
        options: BILAN_OPTIONS,
        allowAutre: true,
        required: true,
      },
      { key: "commentaire_bilan", label: "Commentaire", type: "textarea" },
    ],
  },
  {
    n: 5,
    title: "Sécurité (QSSE)",
    champs: QSSE_FIELDS.map((q) => ({
      key: q.key,
      label: q.label,
      type: "single" as const,
      options: [...OUI_NON_SO],
      required: true,
    })),
  },
  {
    n: 6,
    title: "Satisfaction globale et recommandation",
    champs: [
      {
        key: "satisfaction_globale",
        label: "Quelle est votre satisfaction globale ? (1 à 5)",
        type: "note5",
        required: true,
        verrou: true,
        roleStat: "satisfaction",
      },
      {
        key: "nps",
        label: "Sur une échelle de 0 à 10, recommanderiez-vous nos prestations ?",
        type: "nps",
        required: true,
        verrou: true,
        roleStat: "nps",
      },
      { key: "commentaire_satisfaction", label: "Commentaire", type: "textarea" },
    ],
  },
  {
    n: 7,
    title: "Développement et suite",
    champs: [
      {
        key: "besoins_futurs",
        label: "Quels sont vos futurs projets / autres besoins ?",
        type: "multi",
        options: BESOINS_OPTIONS,
        allowAutre: true,
      },
      {
        key: "amelioration_prestations",
        label: "Comment pourrions-nous améliorer nos prestations ?",
        type: "textarea",
      },
    ],
  },
  {
    n: 8,
    title: "Plan d'actions",
    champs: [
      {
        key: "plan_actions",
        label: "Action à prévoir",
        type: "multi",
        options: PLAN_ACTIONS_OPTIONS,
        allowAutre: true,
        required: true,
      },
      { key: "delais_actions", label: "Délais de réalisation des actions", type: "text" },
      {
        key: "nouvelle_date_suivi",
        label: "Nouvelle date de suivi",
        type: "date",
        required: true,
        verrou: true,
      },
      { key: "commentaire_plan", label: "Commentaire", type: "textarea" },
    ],
  },
  {
    n: 9,
    title: "Validation",
    champs: [
      {
        key: "nom_representant",
        label: "Nom du représentant client",
        type: "text",
        required: true,
      },
      {
        key: "mail_representant",
        label: "Adresse mail du représentant client",
        type: "email",
        required: true,
      },
    ],
  },
];
