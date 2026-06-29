/**
 * Logique pure du garde-fou d'impartialité §9.2.2 (ISO 9001) :
 * « les auditeurs ne doivent pas auditer leur propre travail ».
 *
 * Isolée ici (sans dépendance Supabase) pour être testable unitairement.
 */

/** Marqueur présent dans le message d'avertissement, repéré côté client. */
export const IMPARTIALITE_MARQUEUR = "§9.2.2";

export type ProcessusPilotage = {
  id: string;
  nom: string;
  /** Pilotes du processus (legacy `pilote_id` + table `processus_pilotes`). */
  piloteIds: string[];
};

/**
 * Renvoie la liste des noms de processus audités dont l'auditeur est pilote
 * (conflit d'impartialité). Vide si aucun conflit ou auditeur non renseigné.
 */
export function processusEnConflit(
  auditeurId: string | undefined | null,
  processus: ProcessusPilotage[],
): string[] {
  if (!auditeurId) return [];
  const conflits = new Set<string>();
  for (const p of processus) {
    if (p.piloteIds.includes(auditeurId)) conflits.add(p.nom);
  }
  return [...conflits];
}

/**
 * Construit le message d'avertissement §9.2.2 à partir des processus en
 * conflit, ou `null` si l'attribution est conforme.
 */
export function messageImpartialite(processusConflit: string[]): string | null {
  if (processusConflit.length === 0) return null;
  return `Atteinte à l'impartialité (ISO 9001 ${IMPARTIALITE_MARQUEUR}) : l'auditeur est pilote de ${processusConflit.join(
    ", ",
  )}. Un auditeur ne peut pas auditer son propre travail. Choisissez un autre auditeur, ou confirmez pour passer outre.`;
}
