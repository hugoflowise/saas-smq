/**
 * Construit un lien vers NOTRE callback à partir des propriétés renvoyées par
 * `admin.auth.admin.generateLink`.
 *
 * On n'utilise PAS le lien Supabase brut (`action_link`) : il suit le flux PKCE,
 * qui exige un `code_verifier` stocké côté navigateur au moment de l'initiation.
 * Pour un lien généré côté serveur (invitation, réinitialisation) ce verifier
 * n'existe pas, l'échange du `code` échoue et l'utilisateur retombe sur la page
 * de connexion. On passe donc par `token_hash` + `verifyOtp` côté serveur.
 */
export function callbackLinkFromProperties(
  base: string,
  properties: { hashed_token?: string; verification_type?: string } | null | undefined,
  next: string,
): string | null {
  const tokenHash = properties?.hashed_token;
  const type = properties?.verification_type;
  if (!tokenHash || !type) return null;
  const params = new URLSearchParams({ token_hash: tokenHash, type, next });
  return `${base}/auth/callback?${params.toString()}`;
}
