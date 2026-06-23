// ============================================================================
// Droits par rôle : source unique de vérité (UI + server actions).
// ----------------------------------------------------------------------------
//   auditeur      : lecture seule (aucune écriture).
//   manager       : écrit (crée/modifie/supprime) mais NE valide pas / signe pas.
//   dirigeant     : tout, y compris validation / approbation / signature.
//   admin_flowise : tout + multi-clients.
// La sécurité réelle reste assurée en base (RLS + trigger lecture seule) ;
// ces helpers servent à refléter les droits dans l'interface et à renvoyer
// des messages clairs côté server actions.
// ============================================================================

/** Rôle en lecture seule : ne peut rien créer/modifier/supprimer. */
export function isReadOnly(role: string): boolean {
  return role === "auditeur";
}

/** Peut créer / modifier / supprimer (tout sauf l'auditeur). */
export function canWrite(role: string): boolean {
  return !isReadOnly(role);
}

/** Peut valider / approuver / signer (dirigeant ou admin Flowise uniquement). */
export function canApprove(role: string): boolean {
  return role === "admin_flowise" || role === "dirigeant";
}

/** Peut gérer les utilisateurs du client (inviter, changer les rôles, retirer). */
export function canManageUsers(role: string): boolean {
  return role === "admin_flowise" || role === "dirigeant";
}

/** Rôles qu'un dirigeant peut attribuer à un membre de son organisation. */
export const ROLES_ASSIGNABLES = ["dirigeant", "manager", "auditeur"] as const;
export type RoleAssignable = (typeof ROLES_ASSIGNABLES)[number];

/** Libellés des rôles pour l'affichage. */
export const ROLE_MEMBRE_LABELS: Record<string, string> = {
  admin_flowise: "Administrateur Flowise",
  dirigeant: "Dirigeant",
  manager: "Manager",
  auditeur: "Auditeur (lecture seule)",
};
