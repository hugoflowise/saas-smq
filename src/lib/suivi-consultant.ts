/** Configuration du formulaire « Suivi consultant » (terrain, sans connexion). */

export type ChampType =
  | "text"
  | "email"
  | "textarea"
  | "date"
  | "single"
  | "multi"
  | "note5"
  | "nps";

export type Champ = {
  key: string;
  label: string;
  type: ChampType;
  required?: boolean;
  options?: string[];
  /** Liste à choix multiple avec une entrée « Autre » libre (champ `${key}_autre`). */
  allowAutre?: boolean;
  /** Affiché seulement si le champ `key` vaut `equals`. */
  showIf?: { key: string; equals: string };
};

export type SectionConfig = { n: number; title: string; champs: Champ[] };

const OUI_NON = ["Oui", "Non"];

/** Liste commune points forts / axes d'amélioration. */
export const POINTS_OPTIONS = [
  "Compétences techniques",
  "Qualité du travail",
  "Respect des délais et des engagements",
  "Autonomie et fiabilité",
  "Implication dans la mission",
  "Relation avec le client",
  "Capacité d'adaptation",
  "Communication et reporting",
  "Intégration dans l'équipe",
  "Force de proposition",
];

export const SUIVI_CONSULTANT_SECTIONS: SectionConfig[] = [
  {
    n: 1,
    title: "Identification",
    champs: [
      { key: "nom", label: "Nom (Prénom NOM)", type: "text", required: true },
      { key: "email", label: "Adresse mail", type: "email", required: true },
      { key: "client", label: "Client actuel", type: "text", required: true },
      { key: "poste", label: "Poste / mission", type: "text", required: true },
      { key: "site_intervention", label: "Site d'intervention", type: "text", required: true },
      { key: "date_demarrage", label: "Date de démarrage", type: "date" },
      { key: "date_fin_prevue", label: "Date de fin prévue", type: "date" },
    ],
  },
  {
    n: 2,
    title: "Activité et avancement",
    champs: [
      { key: "description_activites", label: "Description des activités", type: "textarea" },
      {
        key: "etat_avancement",
        label: "État d'avancement",
        type: "single",
        options: ["Démarrage", "En cours", "Bien avancé", "Terminé"],
      },
      {
        key: "points_forts",
        label: "Points forts",
        type: "multi",
        options: POINTS_OPTIONS,
        allowAutre: true,
        required: true,
      },
      {
        key: "axes_amelioration",
        label: "Axes d'amélioration",
        type: "multi",
        options: POINTS_OPTIONS,
        allowAutre: true,
        required: true,
      },
      {
        key: "coherence_odm",
        label: "Votre activité est-elle cohérente avec votre Ordre De Mission ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "coherence_odm_details",
        label: "Si non, précisez",
        type: "textarea",
        showIf: { key: "coherence_odm", equals: "Non" },
      },
    ],
  },
  {
    n: 3,
    title: "Risques et santé au travail",
    champs: [
      {
        key: "risques_principaux",
        label: "Citez les 3 principaux risques liés à votre activité",
        type: "textarea",
        required: true,
      },
      {
        key: "note_environnement",
        label: "Environnement de travail (T°, éclairage, hygrométrie, ergonomie)",
        type: "note5",
      },
      { key: "note_hygiene", label: "Conditions d'hygiène", type: "note5" },
      {
        key: "insatisfaction_details",
        label: "Si vous êtes insatisfait, précisez",
        type: "textarea",
      },
      {
        key: "politiques_qsse",
        label: "Citez 4 points des politiques Qualité, Sécurité, Santé et Environnement",
        type: "textarea",
      },
      {
        key: "droit_retrait",
        label: "Connaissez-vous votre droit de retrait ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
    ],
  },
  {
    n: 4,
    title: "Sur le site client",
    champs: [
      {
        key: "plan_prevention",
        label: "Un plan de prévention est-il disponible et valide ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "point_rassemblement",
        label: "Connaissez-vous le point de rassemblement ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "consignes_environnement",
        label: "Appliquez-vous des consignes environnementales particulières (recyclage…) ?",
        type: "single",
        options: OUI_NON,
      },
      { key: "commentaires_site", label: "Commentaires", type: "textarea" },
    ],
  },
  {
    n: 5,
    title: "Équipements de protection (EPI)",
    champs: [
      {
        key: "epi_connus",
        label: "Connaissez-vous les EPI obligatoires pour votre mission ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "epi_fournis_par",
        label: "Les EPI vous ont été fournis par",
        type: "single",
        options: ["Le client", "Le manager", "Achat personnel", "Autre"],
      },
      {
        key: "epi_en_phase",
        label: "Les EPI sont-ils en phase avec les risques QSSE de votre mission ?",
        type: "single",
        options: OUI_NON,
      },
      { key: "epi_liste", label: "Liste des EPI à votre disposition", type: "textarea" },
    ],
  },
  {
    n: 6,
    title: "Radioprotection",
    champs: [
      {
        key: "secteur_nucleaire",
        label: "Intervenez-vous dans le secteur nucléaire ?",
        type: "single",
        options: OUI_NON,
      },
      {
        key: "radio_categorie",
        label: "À quelle catégorie de travailleur appartenez-vous ?",
        type: "single",
        options: ["Catégorie A", "Catégorie B", "Non classé"],
        showIf: { key: "secteur_nucleaire", equals: "Oui" },
      },
      {
        key: "radio_zone",
        label: "À quel type de zone avez-vous accès ?",
        type: "single",
        options: ["Zone surveillée", "Zone contrôlée", "Aucune"],
        showIf: { key: "secteur_nucleaire", equals: "Oui" },
      },
      {
        key: "dosimetre_alarme",
        label: "Déclenchement de l'alarme du dosimètre depuis le dernier point ?",
        type: "single",
        options: OUI_NON,
        showIf: { key: "secteur_nucleaire", equals: "Oui" },
      },
      {
        key: "dosimetre_details",
        label: "Si oui : seuil concerné et dose d'exposition",
        type: "text",
        showIf: { key: "dosimetre_alarme", equals: "Oui" },
      },
    ],
  },
  {
    n: 7,
    title: "Compétences et accompagnement",
    champs: [
      {
        key: "habilitations",
        label: "Des habilitations sont-elles nécessaires pour votre poste ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "besoin_accompagnement",
        label: "Avez-vous besoin d'un accompagnement (formation…) ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "accompagnement_details",
        label: "Si oui, précisez",
        type: "textarea",
        showIf: { key: "besoin_accompagnement", equals: "Oui" },
      },
      { key: "commentaires_competences", label: "Commentaires", type: "textarea" },
    ],
  },
  {
    n: 8,
    title: "Conditions et bien-être",
    champs: [
      {
        key: "autonome",
        label: "Êtes-vous autonome dans vos tâches ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "relation_conflictuelle",
        label: "Êtes-vous en relation conflictuelle avec le client ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "harcelement",
        label: "Êtes-vous en situation de harcèlement au travail ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      {
        key: "stress_repetition",
        label: "Êtes-vous en situation de stress à répétition ?",
        type: "single",
        options: OUI_NON,
        required: true,
      },
      { key: "commentaires_bienetre", label: "Commentaires", type: "textarea" },
    ],
  },
  {
    n: 9,
    title: "Satisfaction et recommandation",
    champs: [
      {
        key: "note_qualite_suivi_manager",
        label: "Qualité du suivi avec votre manager",
        type: "note5",
        required: true,
      },
      {
        key: "satisfaction_globale",
        label: "Satisfaction globale de votre expérience consultant",
        type: "note5",
        required: true,
      },
      {
        key: "nps",
        label: "Recommanderiez-vous votre entreprise à un proche ? (0 à 10)",
        type: "nps",
        required: true,
      },
      {
        key: "satisfaction_details",
        label: "Si vous êtes insatisfait, précisez",
        type: "textarea",
      },
    ],
  },
  {
    n: 10,
    title: "Amélioration continue et RSE",
    champs: [
      {
        key: "situation_dangereuse",
        label: "Citez une situation dangereuse immédiate",
        type: "textarea",
      },
      {
        key: "action_sensibilisation",
        label: "Citez une action de sensibilisation QSSE que vous avez menée ou observée",
        type: "textarea",
      },
      { key: "idee_amelioration", label: "Une idée d'amélioration", type: "textarea" },
      {
        key: "force_proposition",
        label: "Pouvez-vous être force de proposition auprès du client ?",
        type: "single",
        options: OUI_NON,
      },
      {
        key: "client_politique_env",
        label: "Le client a-t-il une politique environnementale / un bilan carbone ?",
        type: "single",
        options: OUI_NON,
      },
      {
        key: "gisements_economies_env",
        label:
          "Avez-vous identifié des gisements d'économies environnementaux (déchets, eau, ISO 14001…) ?",
        type: "textarea",
      },
    ],
  },
];

/** Tous les champs, à plat (pour l'export et la fiche détail). */
export const SUIVI_CONSULTANT_CHAMPS: Champ[] = SUIVI_CONSULTANT_SECTIONS.flatMap((s) => s.champs);

/** Clés QSSE retenues pour le taux de conformité (réponse « Oui » attendue). */
export const QSSE_CONFORMITE_KEYS = [
  "droit_retrait",
  "plan_prevention",
  "point_rassemblement",
  "epi_connus",
] as const;

/** Clés signalant une alerte santé / RPS (réponse « Oui » = alerte). */
export const ALERTE_KEYS = ["relation_conflictuelle", "harcelement", "stress_repetition"] as const;
