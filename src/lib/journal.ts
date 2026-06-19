/** Métadonnées d'affichage de la main courante (journal d'audit). */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  sign: "Signature",
  publish: "Publication",
};

export const AUDIT_ACTION_CLASS: Record<string, string> = {
  create: "bg-status-conforme/15 text-status-conforme",
  update: "bg-status-pa/15 text-status-pa",
  delete: "bg-status-nc-mineure/15 text-status-nc-mineure",
  sign: "bg-primary/15 text-primary",
  publish: "bg-primary/15 text-primary",
};

/** entity_type (nom de table) -> libellé lisible + lien vers le module. */
export const AUDIT_ENTITY: Record<string, { label: string; href: string | null }> = {
  politique_qualite: { label: "Politique qualité", href: "/strategie/politique" },
  procedures: { label: "Procédure", href: "/documentation/procedures" },
  actions: { label: "Action", href: "/actions" },
  non_conformites: { label: "Non-conformité", href: "/nc" },
  reclamations: { label: "Réclamation", href: "/reclamations" },
  risques_opportunites: { label: "Risque / Opportunité", href: "/risques" },
  objectifs_qualite: { label: "Objectif qualité", href: "/strategie/objectifs" },
  audits_internes: { label: "Audit", href: "/audits" },
  reunions: { label: "Réunion QHSE", href: "/reunions" },
  revues_direction: { label: "Revue de direction", href: "/revues/direction" },
  fournisseurs: { label: "Fournisseur", href: "/fournisseurs" },
  communications: { label: "Communication", href: "/communications" },
  jalons_certification: { label: "Jalon de certification", href: "/certification" },
  processus: { label: "Processus", href: "/processus" },
  contexte_organisme: { label: "Contexte", href: "/strategie/contexte" },
  parties_interessees: { label: "Partie intéressée", href: "/strategie/parties-prenantes" },
  conformite_evaluation: { label: "Conformité ISO", href: "/conformite" },
  veille_reglementaire: { label: "Veille réglementaire", href: "/veille" },
  consultants: { label: "Consultant", href: "/effectif" },
  indicateurs: { label: "Indicateur", href: "/indicateurs" },
};

export function entityLabel(type: string): string {
  return AUDIT_ENTITY[type]?.label ?? type;
}

/** Libellé court d'un champ pour l'affichage du diff. */
export function fieldLabel(key: string): string {
  return key.replace(/_/g, " ");
}
