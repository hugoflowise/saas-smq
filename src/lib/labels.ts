/** Libellés FR des énumérations métier (affichage). */

export const ACTION_STATUT_LABELS = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
  bloquee: "Bloquée",
  abandonnee: "Abandonnée",
} as const;

export const ACTION_PRIORITE_LABELS = {
  p1: "P1 · Haute",
  p2: "P2 · Moyenne",
  p3: "P3 · Basse",
} as const;

export const ACTION_TYPE_LABELS = {
  preventive: "Préventive",
  corrective: "Corrective",
} as const;

export const ACTION_ORIGINE_LABELS = {
  manuelle: "Manuelle",
  demarrage_smq: "Démarrage SMQ",
  audit_interne: "Audit interne",
  audit_externe: "Audit externe",
  nc: "Non-conformité",
  rdd: "Revue de direction",
  r_o: "Risques & Opportunités",
  reclamation: "Réclamation",
  amelioration_continue: "Amélioration continue",
  reunion: "Réunion QHSE",
} as const;

export const ACTION_STATUTS = Object.keys(
  ACTION_STATUT_LABELS,
) as (keyof typeof ACTION_STATUT_LABELS)[];
export const ACTION_PRIORITES = Object.keys(
  ACTION_PRIORITE_LABELS,
) as (keyof typeof ACTION_PRIORITE_LABELS)[];

export const NC_ORIGINE_LABELS = {
  audit_interne: "Audit interne",
  audit_externe: "Audit externe",
  client: "Client",
  collaborateur: "Collaborateur",
  rdd: "Revue de direction",
  autre: "Autre",
} as const;

export const NC_GRAVITE_LABELS = {
  mineure: "Mineure",
  majeure: "Majeure",
  critique: "Critique",
} as const;

export const NC_TYPE_LABELS = {
  nc_produit: "NC produit/service",
  nc_processus: "NC processus",
  reclamation_client: "Réclamation client",
} as const;

export const NC_STATUT_LABELS = {
  ouverte: "Ouverte",
  analysee: "Analysée",
  action_definie: "Action définie",
  cloturee: "Clôturée",
  efficace: "Clôturée · efficace",
  inefficace: "Clôturée · inefficace",
} as const;

export const NC_STATUTS = Object.keys(NC_STATUT_LABELS) as (keyof typeof NC_STATUT_LABELS)[];

export const AUDIT_TYPE_LABELS = {
  interne: "Interne",
  externe: "Externe",
  fournisseur: "Fournisseur",
} as const;

export const AUDIT_STATUT_LABELS = {
  planifie: "Planifié",
  en_cours: "En cours",
  realise: "Réalisé",
  rapport_redige: "Rapport rédigé",
  cloture: "Clôturé",
} as const;

export const ROLE_LABELS = {
  admin_flowise: "Administrateur Flowise",
  dirigeant: "Dirigeant",
  manager: "Manager",
  auditeur: "Auditeur (lecture seule)",
} as const;

// Secteur d'activité du client. « AT » (assistance technique) est un héritage
// conservé pour l'affichage mais n'est plus proposé à la saisie (toutes les
// sociétés d'ingénierie / ESN font de l'AT — ce n'est pas un secteur).
export const SECTEUR_LABELS = {
  SI: "Société d'ingénierie",
  ESN: "ESN",
  AT: "Assistance technique",
  autre: "Autre",
} as const;

// Secteurs proposés à la saisie (création / modification d'un client).
export const SECTEUR_OPTIONS = ["SI", "ESN", "autre"] as const;
