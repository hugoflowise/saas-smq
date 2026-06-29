/**
 * Wrapper `fetch` pour l'API BoondManager (brique inerte).
 *
 * ⚠️ NE PAS appeler ce module depuis l'app tant que le partenariat technique
 * n'est pas confirmé et que les tokens ne sont pas chiffrés (Supabase Vault).
 * Il est posé ici pour être branché plus tard.
 *
 * Rôle : construire l'en-tête JWT adéquat, préfixer l'URL de base, parser le JSON
 * et renvoyer une erreur typée. Il ne décide rien sur la persistance ni la
 * synchronisation (voir docs/integration-boond.md).
 */

import { buildAppJwt, buildClientJwt } from "./jwt";
import type { BoondCredentials, BoondJwtMode } from "./types";

/**
 * URL de base de l'API BoondManager.
 *
 * À CONFIRMER au rdv : la valeur publique communément utilisée est
 * `https://ui.boondmanager.com/api`. On la rend surchargeable par variable
 * d'environnement pour cibler la Sandbox sans toucher au code.
 */
export const BOOND_BASE_URL = process.env.BOOND_BASE_URL ?? "https://ui.boondmanager.com/api";

/** En-têtes HTTP porteurs du JWT, selon le mode d'authentification. */
const JWT_HEADER_NAME = {
  app: "X-Jwt-App-BoondManager",
  client: "X-Jwt-Client-BoondManager",
} as const;

/** Erreur typée d'un appel Boond (statut HTTP + message). */
export class BoondApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "BoondApiError";
  }
}

/** Construit l'en-tête d'authentification (nom + JWT) pour des identifiants donnés. */
export function authHeader(
  creds: BoondCredentials,
  options: { time?: number; mode?: BoondJwtMode } = {},
): Record<string, string> {
  if (creds.mode === "app") {
    return { [JWT_HEADER_NAME.app]: buildAppJwt(creds, options) };
  }
  return { [JWT_HEADER_NAME.client]: buildClientJwt(creds, options) };
}

/** Options d'une requête Boond. */
export type BoondRequestOptions = {
  /** Méthode HTTP (GET par défaut). */
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Paramètres de requête. */
  query?: Record<string, string | number | undefined>;
  /** Corps JSON (sérialisé automatiquement). */
  body?: unknown;
  /** Implémentation fetch (injectable pour les tests). Par défaut : globalThis.fetch. */
  fetchImpl?: typeof fetch;
  /** Mode applicatif du JWT. */
  mode?: BoondJwtMode;
};

/**
 * Effectue un appel à l'API BoondManager et renvoie le JSON parsé.
 *
 * @throws {BoondApiError} si la réponse n'est pas 2xx.
 */
export async function boondRequest<T = unknown>(
  creds: BoondCredentials,
  path: string,
  options: BoondRequestOptions = {},
): Promise<T> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const url = new URL(`${BOOND_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...authHeader(creds, { mode: options.mode }),
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetchImpl(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Réponse non-JSON : on conserve le texte brut pour le diagnostic.
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new BoondApiError(response.status, `Appel Boond échoué (${response.status})`, parsed);
  }
  return parsed as T;
}
