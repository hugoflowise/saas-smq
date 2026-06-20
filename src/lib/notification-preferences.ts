/**
 * Préférences de notification d'un utilisateur, stockées en JSONB dans
 * `profiles.notification_preferences`. Tous les champs sont optionnels :
 * une préférence absente prend sa valeur par défaut (tout activé).
 */
export type NotificationPreferences = {
  /** Recevoir les notifications aussi par e-mail (défaut : true). */
  email?: boolean;
};

/**
 * Indique si l'utilisateur souhaite recevoir les notifications par e-mail.
 * Par défaut `true` : l'e-mail n'est désactivé que si la préférence vaut
 * explicitement `false` (opt-out), pour ne jamais « oublier » un destinataire.
 */
export function wantsEmail(prefs: unknown): boolean {
  if (prefs && typeof prefs === "object" && "email" in prefs) {
    return (prefs as NotificationPreferences).email !== false;
  }
  return true;
}
