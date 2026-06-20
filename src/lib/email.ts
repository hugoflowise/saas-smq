import "server-only";
import { Resend } from "resend";

/**
 * Envoi d'e-mails transactionnels via Resend.
 *
 * Conçu pour être **défensif** : tant que `RESEND_API_KEY` n'est pas défini,
 * toutes les fonctions deviennent des no-op silencieux — l'application
 * fonctionne normalement (les notifications in-app restent actives), aucun
 * e-mail n'est envoyé. Activer l'envoi = renseigner les variables d'env
 * (voir `.env.example`) et redémarrer.
 *
 * Pour activer en production :
 * 1. Créer un compte sur https://resend.com et une clé API.
 * 2. Vérifier un domaine d'envoi (DNS), puis définir `RESEND_FROM`
 *    (ex. "Flowise Qualité <qualite@mondomaine.fr>").
 * 3. Renseigner `RESEND_API_KEY` (et `NEXT_PUBLIC_APP_URL` pour les liens).
 */

// Expéditeur. `onboarding@resend.dev` fonctionne sans domaine vérifié (tests).
const FROM = process.env.RESEND_FROM ?? "Flowise Qualité <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

/** Vrai si l'envoi d'e-mails est configuré (clé API présente). */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Envoie un e-mail. Renvoie `true` si envoyé, `false` sinon (non configuré ou
 * erreur). Ne lève jamais d'exception : l'envoi est best-effort et ne doit
 * pas faire échouer l'action appelante.
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    const { error } = await c.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("[email] Resend a renvoyé une erreur :", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] échec d'envoi :", err);
    return false;
  }
}

/**
 * Gabarit HTML d'un e-mail de notification, aux couleurs de l'application.
 * `link` peut être absolu ou relatif (préfixé alors par `NEXT_PUBLIC_APP_URL`).
 */
export function notificationEmailHtml(opts: {
  title: string;
  body?: string;
  link?: string;
}): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const href = opts.link
    ? opts.link.startsWith("http")
      ? opts.link
      : `${base}${opts.link}`
    : null;
  const bouton = href
    ? `<a href="${href}" style="display:inline-block;margin-top:16px;background:#ff6b5e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Ouvrir dans Flowise</a>`
    : "";
  const corps = opts.body
    ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6">${opts.body}</p>`
    : "";
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#ff6b5e;font-weight:700">Flowise Pilotage SMQ</p>
    <h1 style="margin:0;font-size:18px;color:#0f172a">${opts.title}</h1>
    ${corps}
    ${bouton}
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Notification automatique — Flowise Pilotage SMQ</p>
</div>`;
}
