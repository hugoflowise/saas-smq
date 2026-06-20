/**
 * Classes Tailwind partagées pour les `<select>` natifs.
 *
 * Source de vérité unique : pour changer le style de tous les selects de l'app,
 * il suffit de modifier ce fichier. (Auparavant, chaque composant redéfinissait
 * localement sa propre constante `SELECT_CLASS`, soit ~30 copies à maintenir.)
 *
 * Les 4 variantes couvrent les usages réels ; choisir selon le contexte :
 * - {@link SELECT_CLASS}         : champ de formulaire pleine largeur (dialogues) ;
 * - {@link SELECT_CLASS_INLINE}  : champ inline (édition au fil de l'eau), largeur auto ;
 * - {@link SELECT_CLASS_FILTER}  : filtre posé sur le fond de page (fond « carte ») ;
 * - {@link SELECT_CLASS_COMPACT} : variante dense (lignes serrées, ex. conformité).
 */

// Base commune : coins, bordure et focus accessible, alignés sur le composant Input.
const SELECT_FOCUS =
  "rounded-lg border border-input outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const SELECT_CLASS = `h-9 w-full bg-transparent px-3 text-sm ${SELECT_FOCUS}`;
export const SELECT_CLASS_INLINE = `h-9 bg-transparent px-3 text-sm ${SELECT_FOCUS}`;
export const SELECT_CLASS_FILTER = `h-9 bg-card px-3 text-sm ${SELECT_FOCUS}`;
export const SELECT_CLASS_COMPACT = `h-8 bg-card px-2 text-sm ${SELECT_FOCUS}`;
