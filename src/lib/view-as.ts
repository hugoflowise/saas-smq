// Constantes partagées (client + serveur) pour la vue simulée des admins.
// Les fonctions de lecture/écriture du cookie sont dans `view-as-cookie.ts`
// (serveur uniquement) afin de ne pas tirer `next/headers` côté client.

/** Rôles qu'un admin Flowise peut simuler pour prévisualiser l'app. */
export const ROLES_SIMULABLES = ["dirigeant", "manager", "auditeur"] as const;
export type RoleSimulable = (typeof ROLES_SIMULABLES)[number];

/** Libellés d'affichage des rôles (vue admin incluse). */
export const ROLE_LABELS: Record<string, string> = {
  admin_flowise: "Administrateur",
  dirigeant: "Dirigeant",
  manager: "Manager",
  auditeur: "Auditeur",
};

export function estSimulable(value: string | undefined): value is RoleSimulable {
  return ROLES_SIMULABLES.includes((value ?? "") as RoleSimulable);
}
