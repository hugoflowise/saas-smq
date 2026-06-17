/** Libellés FR des énumérations métier (affichage). */

export const ACTION_STATUT_LABELS = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
  bloquee: "Bloquée",
  abandonnee: "Abandonnée",
} as const;

export const ACTION_PRIORITE_LABELS = {
  p1: "P1 — Haute",
  p2: "P2 — Moyenne",
  p3: "P3 — Basse",
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
} as const;

export const ACTION_STATUTS = Object.keys(
  ACTION_STATUT_LABELS,
) as (keyof typeof ACTION_STATUT_LABELS)[];
export const ACTION_PRIORITES = Object.keys(
  ACTION_PRIORITE_LABELS,
) as (keyof typeof ACTION_PRIORITE_LABELS)[];
