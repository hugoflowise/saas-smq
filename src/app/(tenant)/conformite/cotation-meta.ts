export const COTATION_LABELS = {
  non_evalue: "Non évalué",
  conforme: "Conforme",
  point_fort: "Point fort",
  point_attention: "Point d'attention",
  nc_mineure: "NC mineure",
  nc_majeure: "NC majeure",
  non_applicable: "Non applicable",
} as const;

export type Cotation = keyof typeof COTATION_LABELS;

/** Classe de pastille de couleur par cotation. */
export const COTATION_DOT: Record<Cotation, string> = {
  non_evalue: "bg-muted-foreground/40",
  conforme: "bg-status-conforme",
  point_fort: "bg-status-pf",
  point_attention: "bg-status-pa",
  nc_mineure: "bg-status-nc-mineure",
  nc_majeure: "bg-status-nc-majeure",
  non_applicable: "bg-muted-foreground/30",
};

export const DOMAINE_LABELS: Record<string, string> = {
  contexte: "4. Contexte de l'organisme",
  leadership: "5. Leadership",
  planification: "6. Planification",
  support: "7. Support",
  realisation: "8. Réalisation des activités",
  evaluation: "9. Évaluation des performances",
  amelioration: "10. Amélioration",
};

export const DOMAINE_ORDER = [
  "contexte",
  "leadership",
  "planification",
  "support",
  "realisation",
  "evaluation",
  "amelioration",
];
