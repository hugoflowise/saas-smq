/**
 * Types de l'intégration BoondManager (préparation — voir docs/integration-boond.md).
 *
 * IMPORTANT : ce module est INERTE tant que le partenariat technique n'est pas
 * confirmé. Aucune fonction ici ne déclenche d'appel réseau ; seules les briques
 * (construction de JWT, wrapper fetch, types) sont posées pour être branchées
 * plus tard une fois les accès Boond obtenus.
 *
 * Modèle multi-tenant : chaque client Flowise = un compte BoondManager distinct.
 * On stocke ses identifiants PAR tenant (table `tenants`, voir migration
 * 20260629180000_boond_connexion.sql). Tout appel est donc scoppé au compte du
 * client → isolation native des données.
 */

/**
 * Mode d'authentification choisi pour un tenant.
 * - `app`    : JWT « App » (en-tête X-Jwt-App-BoondManager) — recommandé en SaaS.
 * - `client` : JWT « Client » (en-tête X-Jwt-Client-BoondManager).
 *
 * (Le mode Basic auth login/mdp existe côté Boond mais est volontairement exclu
 * d'un contexte SaaS multi-tenant.)
 */
export type BoondAuthMode = "app" | "client";

/**
 * Identifiants de connexion d'un tenant au mode « App-JWT ».
 *
 * - `userToken` : jeton d'un compte BoondManager (réglages utilisateur > sécurité).
 * - `appToken`  : jeton fourni par BoondManager à l'installation de l'app.
 * - `appKey`    : clé de l'app (admin client > apps > votre app) — sert de clé de
 *   signature HMAC-SHA256 du JWT. NE JAMAIS exposer côté client.
 */
export type BoondAppCredentials = {
  mode: "app";
  userToken: string;
  appToken: string;
  appKey: string;
};

/**
 * Identifiants de connexion d'un tenant au mode « Client-JWT ».
 *
 * - `userToken`   : jeton d'un compte BoondManager (réglages utilisateur > sécurité).
 * - `clientToken` : jeton (admin client > developer space > API/Sandbox).
 * - `clientKey`   : clé (admin client > developer space > API/Sandbox) — clé de
 *   signature HMAC-SHA256 du JWT. NE JAMAIS exposer côté client.
 */
export type BoondClientCredentials = {
  mode: "client";
  userToken: string;
  clientToken: string;
  clientKey: string;
};

/** Identifiants d'un tenant, quel que soit le mode. */
export type BoondCredentials = BoondAppCredentials | BoondClientCredentials;

/**
 * Charge utile (payload) du JWT BoondManager.
 *
 * Format vérifié dans pyboondmanager (boondmanager/auth.py) : 4 champs, dans cet
 * ordre. `time` = timestamp UNIX (secondes) de création — Boond ne définit pas
 * d'expiration côté payload. `mode` vaut « normal » par défaut.
 */
export type BoondJwtPayload = {
  userToken: string;
  clientToken: string;
  time: number;
  mode: BoondJwtMode;
};

/** Mode applicatif transmis dans le JWT (différent de {@link BoondAuthMode}). */
export type BoondJwtMode = "normal" | "god";

/** En-tête JWT BoondManager (algorithme HS256). */
export type BoondJwtHeader = {
  alg: "HS256";
  typ: "JWT";
};

/** État de synchronisation d'un tenant avec Boond (colonne `boond_sync_status`). */
export type BoondSyncStatus = "non_connecte" | "connecte" | "erreur";

// ---------------------------------------------------------------------------
// Réponses minimales de l'API (à compléter une fois les endpoints confirmés).
// Modélisation volontairement partielle : on ne type que ce dont l'app a besoin.
// ---------------------------------------------------------------------------

/** Ressource « consultant » côté Boond (mappée vers public.consultants). */
export type BoondConsultant = {
  /** Identifiant Boond → public.consultants.reference */
  id: string;
  lastName?: string | null;
  firstName?: string | null;
  /** Agence / entité de rattachement. */
  agency?: { name?: string | null } | null;
  /** Intitulé de poste. */
  title?: string | null;
};

/** Point de donnée brut pour un indicateur alimenté par Boond. */
export type BoondIndicatorPoint = {
  /** Libellé de la mesure renvoyée par l'endpoint (`indicateurs.boond_endpoint`). */
  label: string;
  value: number;
};
