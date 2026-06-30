// Référentiel d'affichage du DUERP : échelles de cotation et statuts.
// Cotation = gravité (1-4) × fréquence d'exposition (1-4), niveau = produit (1-16).

export const DUERP_GRAVITE_LABELS: Record<number, string> = {
  1: "1 — Faible",
  2: "2 — Moyenne",
  3: "3 — Grave",
  4: "4 — Très grave",
};

export const DUERP_FREQUENCE_LABELS: Record<number, string> = {
  1: "1 — Rare",
  2: "2 — Occasionnelle",
  3: "3 — Fréquente",
  4: "4 — Permanente",
};

export const DUERP_STATUT_LABELS: Record<string, string> = {
  a_traiter: "À traiter",
  en_cours: "En cours",
  maitrise: "Maîtrisé",
};

/** Seuils de criticité (niveau = gravité × fréquence, de 1 à 16). */
export function duerpNiveauClasse(niveau: number | null): {
  label: string;
  cls: string;
} {
  if (niveau == null) return { label: "—", cls: "text-muted-foreground" };
  if (niveau >= 9) return { label: "Critique", cls: "text-status-nc-majeure" };
  if (niveau >= 5) return { label: "Important", cls: "text-status-pa" };
  if (niveau >= 3) return { label: "Modéré", cls: "text-status-pf" };
  return { label: "Faible", cls: "text-status-conforme" };
}
