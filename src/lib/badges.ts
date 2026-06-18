/** Classes de badges partagées entre les listes (cohérence visuelle inter-modules). */

/** Gravité (non-conformités, réclamations) — échelle mineure → critique. */
export const GRAVITE_BADGE_CLASS: Record<string, string> = {
  mineure: "bg-status-pa/15 text-status-pa",
  majeure: "bg-status-nc-mineure/15 text-status-nc-mineure",
  critique: "bg-status-nc-majeure/15 text-status-nc-majeure",
};

/** Type d'audit — catégories sur la palette du design system. */
export const AUDIT_TYPE_BADGE_CLASS: Record<string, string> = {
  interne: "bg-status-pf/15 text-status-pf",
  externe: "bg-status-pa/15 text-status-pa",
  fournisseur: "bg-status-conforme/15 text-status-conforme",
};

/** Cotation d'écart (conformité, actions). */
export const COTATION_BADGE_CLASS: Record<string, string> = {
  conforme: "bg-status-conforme/15 text-status-conforme",
  point_fort: "bg-status-pf/15 text-status-pf",
  point_attention: "bg-status-pa/15 text-status-pa",
  nc_mineure: "bg-status-nc-mineure/15 text-status-nc-mineure",
  nc_majeure: "bg-status-nc-majeure/15 text-status-nc-majeure",
  non_evalue: "bg-muted text-muted-foreground",
  non_applicable: "bg-muted text-muted-foreground",
};

/** Style commun d'une pastille de badge. */
export const BADGE_BASE = "inline-flex rounded-full px-2 py-0.5 font-medium text-xs";
