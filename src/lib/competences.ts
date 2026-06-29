/** Libellés et logique d'échéance partagés du module Compétences (ISO 9001 §7.2). */

import { dateOffsetISO, todayISO } from "@/lib/format";

/** Statuts d'une compétence pour une personne (clé DB → libellé FR). */
export const COMPETENCE_STATUT_LABELS: Record<string, string> = {
  acquise: "Acquise",
  a_acquerir: "À acquérir",
  a_recycler: "À recycler",
};

/** Seuil (jours) en deçà duquel une habilitation est dite « bientôt expirée ». */
export const ECHEANCE_ALERTE_JOURS = 60;

export type EtatEcheance = "aucune" | "valide" | "bientot" | "expiree";

/**
 * État d'une échéance de validité par rapport à aujourd'hui :
 * - `aucune`  : pas de date d'échéance renseignée ;
 * - `expiree` : date passée ;
 * - `bientot` : dans les {@link ECHEANCE_ALERTE_JOURS} prochains jours ;
 * - `valide`  : au-delà.
 */
export function etatEcheance(dateEcheance: string | null): EtatEcheance {
  if (!dateEcheance) return "aucune";
  const today = todayISO();
  if (dateEcheance < today) return "expiree";
  if (dateEcheance <= dateOffsetISO(ECHEANCE_ALERTE_JOURS)) return "bientot";
  return "valide";
}
