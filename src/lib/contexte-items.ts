/**
 * Point d'une analyse SWOT/PESTEL : identifiant stable + texte.
 * Rétrocompatible avec l'ancien format « chaîne simple » (id vide alors).
 */
export type ContexteItem = { id: string; texte: string };

/** Texte d'un point, qu'il soit une chaîne (ancien format) ou un objet. */
export function itemTexte(x: unknown): string {
  if (typeof x === "string") return x;
  if (x && typeof x === "object" && "texte" in x) {
    return String((x as { texte?: unknown }).texte ?? "");
  }
  return "";
}

/**
 * Normalise une case SWOT/PESTEL en liste de points { id, texte }.
 * Accepte l'ancien format (chaînes, id vide) et le nouveau (objets).
 */
export function normalizeItems(v: unknown): ContexteItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x): ContexteItem => {
      if (typeof x === "string") return { id: "", texte: x };
      if (x && typeof x === "object") {
        return {
          id: String((x as { id?: unknown }).id ?? ""),
          texte: itemTexte(x),
        };
      }
      return { id: "", texte: "" };
    })
    .filter((it) => it.texte.trim().length > 0 || it.id.length > 0);
}
