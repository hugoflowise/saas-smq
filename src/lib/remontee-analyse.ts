// Analyse des causes guidée d'une remontée SSE (MASE Axe 4).
// Le détail structuré est stocké dans reclamations.analyse_details (jsonb),
// la synthèse / cause racine retenue dans reclamations.analyse_causes.

export type AnalyseMethode = "5_pourquoi" | "arbre_causes" | "autre";

/** Étapes de la méthode « 5 pourquoi » (chaque réponse alimente la suivante). */
export const CINQ_POURQUOI = [
  { key: "p1", label: "Pourquoi ?" },
  { key: "p2", label: "Pourquoi cela ?" },
  { key: "p3", label: "Pourquoi cela ?" },
  { key: "p4", label: "Pourquoi cela ?" },
  { key: "p5", label: "Pourquoi cela ? (cause racine probable)" },
] as const;

/** Familles de causes de l'arbre des causes (méthode 5M / Ishikawa). */
export const ARBRE_5M = [
  {
    key: "main_oeuvre",
    label: "Main d'œuvre",
    aide: "Compétence, formation, comportement, habilitation…",
  },
  { key: "materiel", label: "Matériel / machine", aide: "Équipements, EPI, outils, maintenance…" },
  { key: "methode", label: "Méthode", aide: "Modes opératoires, consignes, organisation…" },
  { key: "milieu", label: "Milieu", aide: "Environnement de travail, coactivité, météo…" },
  { key: "matiere", label: "Matière", aide: "Produits, matières, substances utilisées…" },
] as const;

export type AnalyseDetails = Record<string, string>;

/** Champs guidés attendus selon la méthode. */
export function champsAnalyse(
  methode: AnalyseMethode,
): { key: string; label: string; aide?: string }[] {
  if (methode === "5_pourquoi") return [...CINQ_POURQUOI];
  if (methode === "arbre_causes") return [...ARBRE_5M];
  return [];
}
