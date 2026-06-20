/**
 * Types de retour standard des server actions.
 *
 * Toutes les actions renvoient l'une de ces formes pour offrir une interface
 * uniforme aux appelants (dialogues, formulaires). Le client teste `result.ok` :
 * - `ok: true`  → succès ;
 * - `ok: false` → échec, avec un `error` lisible à afficher (toast).
 */

/** Résultat d'une action sans valeur de retour (création simple, mise à jour, suppression). */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Résultat d'une action de création qui renvoie l'identifiant de l'entité créée. */
export type CreateResult = { ok: true; id: string } | { ok: false; error: string };
