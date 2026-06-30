// Référentiel d'affichage et de calcul du DUERP.
// Méthode (reprise du DUERP de référence Fortil) :
//   Risque Initial    Ri = Fréquence (F) × Gravité (G)
//   Risque Résiduel   Rr = arrondi(Ri ÷ Maîtrise (M))
//   Priorité          déduite de Rr.

/** Gravité (G) : valeurs 2 / 4 / 8 / 16. */
export const DUERP_GRAVITE_LABELS: Record<number, string> = {
  2: "2 — Légère (sans arrêt)",
  4: "4 — Sans effet irréversible (avec arrêt)",
  8: "8 — Élevée (incapacité)",
  16: "16 — Très élevée (mortelle)",
};

/** Fréquence d'exposition (F) : valeurs 0 / 2 / 4 / 6 / 8. */
export const DUERP_FREQUENCE_LABELS: Record<number, string> = {
  0: "0 — Aucune exposition",
  2: "2 — Très improbable (1×/an)",
  4: "4 — Improbable (1×/semestre)",
  6: "6 — Probable (1×/mois)",
  8: "8 — Très probable (1×/semaine)",
};

/** Niveau de maîtrise (M) : 1 à 4. */
export const DUERP_MAITRISE_LABELS: Record<number, string> = {
  1: "1 — Aucune mesure / inefficace",
  2: "2 — Mesures insuffisantes",
  3: "3 — Mesures correctes, améliorables",
  4: "4 — Mesures très efficaces",
};

export const DUERP_STATUT_LABELS: Record<string, string> = {
  a_traiter: "À traiter",
  en_cours: "En cours",
  maitrise: "Maîtrisé",
};

export const DUERP_GRAVITE_VALUES = [2, 4, 8, 16] as const;
export const DUERP_FREQUENCE_VALUES = [0, 2, 4, 6, 8] as const;
export const DUERP_MAITRISE_VALUES = [1, 2, 3, 4] as const;

/** Priorité résiduelle déduite du risque résiduel Rr. */
export function duerpPriorite(rr: number | null): {
  code: "p1" | "p2" | "p3" | null;
  label: string;
  cls: string;
} {
  if (rr == null || rr === 0) return { code: null, label: "—", cls: "text-muted-foreground" };
  if (rr >= 43) return { code: "p1", label: "P1", cls: "text-status-nc-majeure" };
  if (rr >= 16) return { code: "p2", label: "P2", cls: "text-status-pa" };
  return { code: "p3", label: "P3", cls: "text-status-conforme" };
}

/** Classe couleur d'un niveau de risque initial Ri (4 → 128). */
export function duerpRiClasse(ri: number | null): string {
  if (ri == null || ri === 0) return "text-muted-foreground";
  if (ri >= 48) return "text-status-nc-majeure";
  if (ri >= 16) return "text-status-pa";
  return "text-status-conforme";
}

/** Mappe une priorité résiduelle vers la priorité du plan d'actions. */
export function duerpPrioriteToAction(rr: number | null): "p1" | "p2" | "p3" {
  return duerpPriorite(rr).code ?? "p3";
}
