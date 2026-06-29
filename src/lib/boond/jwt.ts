/**
 * Construction des JWT d'authentification BoondManager (briques pures, testables).
 *
 * Format vérifié dans le connecteur de référence pyboondmanager
 * (https://github.com/tominardi/pyboondmanager, boondmanager/auth.py) :
 *
 *   header  = { "alg": "HS256", "typ": "JWT" }
 *   payload = { userToken, clientToken, time, mode }   (4 champs, dans cet ordre)
 *   signature = HMAC-SHA256( base64url(header) + "." + base64url(payload), key )
 *   jwt = base64url(header) + "." + base64url(payload) + "." + base64url(signature)
 *
 * - `time` : timestamp UNIX en secondes (création). Boond ne pose pas d'expiration
 *   dans le payload — on regénère un JWT à chaque appel.
 * - `mode` : « normal » par défaut.
 * - Clé de signature : `appKey` (mode App) ou `clientKey` (mode Client).
 * - Le champ « clientToken » du payload reçoit, en mode App, l'`appToken`. Le mode
 *   réel (App vs Client) se distingue uniquement par l'EN-TÊTE HTTP porteur du JWT
 *   (X-Jwt-App-BoondManager vs X-Jwt-Client-BoondManager), pas par le payload.
 *
 * NOTE : on s'appuie sur `node:crypto` (HMAC-SHA256) ; aucune dépendance externe.
 * Ce module ne fait AUCUN appel réseau.
 */

import { createHmac } from "node:crypto";
import type {
  BoondAppCredentials,
  BoondClientCredentials,
  BoondJwtHeader,
  BoondJwtMode,
  BoondJwtPayload,
} from "./types";

/** En-tête JWT constant (HS256). */
const JWT_HEADER: BoondJwtHeader = { alg: "HS256", typ: "JWT" };

/**
 * Encodage base64url (RFC 7515) : base64 standard sans padding, avec `+`→`-` et
 * `/`→`_`. Identique à la logique `base64_url_encode` de pyboondmanager.
 */
export function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Sérialise un objet en JSON puis l'encode en base64url. La sérialisation suit
 * l'ordre d'insertion des clés (déterministe pour un même objet).
 */
function encodeSegment(value: object): string {
  return base64UrlEncode(JSON.stringify(value));
}

/**
 * Construit la charge utile du JWT.
 *
 * @param userToken    Jeton du compte BoondManager.
 * @param secondToken  `appToken` (mode App) ou `clientToken` (mode Client) —
 *                      placé dans le champ « clientToken » du payload.
 * @param options.time Timestamp UNIX (secondes). Par défaut : maintenant.
 * @param options.mode Mode applicatif. Par défaut : « normal ».
 */
export function buildPayload(
  userToken: string,
  secondToken: string,
  options: { time?: number; mode?: BoondJwtMode } = {},
): BoondJwtPayload {
  return {
    userToken,
    clientToken: secondToken,
    time: options.time ?? Math.floor(Date.now() / 1000),
    mode: options.mode ?? "normal",
  };
}

/**
 * Signe `header.payload` en HMAC-SHA256 avec `key` et renvoie la signature
 * encodée en base64url.
 */
export function sign(signingInput: string, key: string): string {
  const digest = createHmac("sha256", key).update(signingInput).digest();
  return base64UrlEncode(digest);
}

/** Assemble un JWT complet à partir d'un payload, d'une clé de signature. */
function assembleJwt(payload: BoondJwtPayload, key: string): string {
  const signingInput = `${encodeSegment(JWT_HEADER)}.${encodeSegment(payload)}`;
  return `${signingInput}.${sign(signingInput, key)}`;
}

/**
 * Construit le JWT « App » (à placer dans l'en-tête X-Jwt-App-BoondManager).
 * Clé de signature : `appKey`. Le payload porte l'`appToken` dans « clientToken ».
 */
export function buildAppJwt(
  creds: BoondAppCredentials,
  options: { time?: number; mode?: BoondJwtMode } = {},
): string {
  const payload = buildPayload(creds.userToken, creds.appToken, options);
  return assembleJwt(payload, creds.appKey);
}

/**
 * Construit le JWT « Client » (à placer dans l'en-tête X-Jwt-Client-BoondManager).
 * Clé de signature : `clientKey`. Le payload porte le `clientToken`.
 */
export function buildClientJwt(
  creds: BoondClientCredentials,
  options: { time?: number; mode?: BoondJwtMode } = {},
): string {
  const payload = buildPayload(creds.userToken, creds.clientToken, options);
  return assembleJwt(payload, creds.clientKey);
}
