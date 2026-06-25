import "server-only";
import { Resend } from "resend";

/**
 * Envoi d'e-mails transactionnels via Resend.
 *
 * Conçu pour être **défensif** : tant que `RESEND_API_KEY` n'est pas défini,
 * toutes les fonctions deviennent des no-op silencieux : l'application
 * fonctionne normalement (les notifications in-app restent actives), aucun
 * e-mail n'est envoyé. Activer l'envoi = renseigner les variables d'env
 * (voir `.env.example`) et redémarrer.
 *
 * Pour activer en production :
 * 1. Créer un compte sur https://resend.com et une clé API.
 * 2. Vérifier un domaine d'envoi (DNS), puis définir `RESEND_FROM`
 *    (ex. "flowise. <qualite@send.flowise.fr>").
 * 3. Renseigner `RESEND_API_KEY` (et `NEXT_PUBLIC_APP_URL` pour les liens).
 */

// Expéditeur. `onboarding@resend.dev` fonctionne sans domaine vérifié (tests).
const FROM = process.env.RESEND_FROM ?? "flowise. <onboarding@resend.dev>";

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
 * En-tête de marque des e-mails : le logo flowise (image distante, nécessite une
 * URL absolue via `NEXT_PUBLIC_APP_URL`). Repli sur le texte « flowise. » si
 * l'URL n'est pas configurée (les clients mail chargent les images à la demande).
 */
function emailLogo(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return base
    ? `<img src="${base}/logo.png" alt="flowise" width="132" style="width:132px;height:auto;display:block;margin:0 0 12px" />`
    : `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.04em;color:#ff6b5e;font-weight:700">flowise.</p>`;
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
    ? `<a href="${href}" style="display:inline-block;margin-top:16px;background:#ff6b5e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Ouvrir dans l'application flowise.</a>`
    : "";
  const corps = opts.body
    ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6">${opts.body}</p>`
    : "";
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
    ${emailLogo()}
    <h1 style="margin:0;font-size:18px;color:#0f172a">${opts.title}</h1>
    ${corps}
    ${bouton}
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Notification automatique · flowise.</p>
</div>`;
}

/**
 * Gabarit HTML de l'e-mail d'invitation : un collègue est invité à rejoindre
 * l'espace qualité d'une société. `actionLink` est le lien (absolu) pour
 * définir son mot de passe et accéder à l'application.
 */
export function inviteEmailHtml(opts: {
  societe: string;
  roleLabel: string;
  actionLink: string;
}): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
    ${emailLogo()}
    <h1 style="margin:0;font-size:18px;color:#0f172a">Vous êtes invité à rejoindre ${opts.societe}</h1>
    <p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6">Vous avez accès à l'espace qualité de ${opts.societe} en tant que <strong>${opts.roleLabel}</strong>. Cliquez ci-dessous pour définir votre mot de passe et vous connecter.</p>
    <a href="${opts.actionLink}" style="display:inline-block;margin-top:16px;background:#ff6b5e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Définir mon mot de passe</a>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px">Si vous n'attendiez pas cette invitation, ignorez cet e-mail.</p>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Invitation · flowise.</p>
</div>`;
}

/**
 * Gabarit HTML de l'e-mail de réinitialisation de mot de passe.
 * `actionLink` est le lien (absolu) menant à la page de définition du mot de passe.
 */
export function resetEmailHtml(opts: { actionLink: string }): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
    ${emailLogo()}
    <h1 style="margin:0;font-size:18px;color:#0f172a">Réinitialisation de votre mot de passe</h1>
    <p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6">Vous avez demandé à réinitialiser votre mot de passe. Cliquez ci-dessous pour en définir un nouveau. Ce lien est valable un temps limité.</p>
    <a href="${opts.actionLink}" style="display:inline-block;margin-top:16px;background:#ff6b5e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Définir un nouveau mot de passe</a>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.</p>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Sécurité · flowise.</p>
</div>`;
}

/** Une section de la liste du digest (titre + lignes cliquables). */
export type DigestSection = {
  titre: string;
  /** Couleur d'accent de la pastille de date (token hex). */
  accent: string;
  lignes: { date: string; label: string; href?: string }[];
};

/**
 * Gabarit HTML du **digest quotidien des échéances** : plusieurs sections
 * (actions en retard, échéances à venir, documents à réviser), chacune en liste.
 * `dateFr` formate une date ISO en « jj/mm/aaaa » (injecté pour rester pur/testable).
 */
export function digestEmailHtml(opts: {
  sections: DigestSection[];
  dateFr: (iso: string) => string;
}): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const lien = (href?: string) =>
    href ? (href.startsWith("http") ? href : `${base}${href}`) : null;

  const sectionsHtml = opts.sections
    .filter((s) => s.lignes.length > 0)
    .map((s) => {
      const items = s.lignes
        .map((l) => {
          const href = lien(l.href);
          const texte = href
            ? `<a href="${href}" style="color:#0f172a;text-decoration:none">${l.label}</a>`
            : `<span style="color:#0f172a">${l.label}</span>`;
          return `<tr>
            <td style="padding:6px 10px 6px 0;white-space:nowrap;vertical-align:top">
              <span style="display:inline-block;background:${s.accent}1a;color:${s.accent};font-size:12px;font-weight:600;padding:2px 8px;border-radius:6px">${opts.dateFr(l.date)}</span>
            </td>
            <td style="padding:6px 0;font-size:14px;line-height:1.5">${texte}</td>
          </tr>`;
        })
        .join("");
      return `<h2 style="margin:20px 0 4px;font-size:14px;color:#334155">${s.titre}</h2>
        <table style="width:100%;border-collapse:collapse">${items}</table>`;
    })
    .join("");

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
    ${emailLogo()}
    <h1 style="margin:0;font-size:18px;color:#0f172a">Vos échéances qualité</h1>
    <p style="margin:6px 0 0;color:#64748b;font-size:13px">Récapitulatif des points à traiter prochainement.</p>
    ${sectionsHtml}
    ${base ? `<a href="${base}/dashboard" style="display:inline-block;margin-top:20px;background:#ff6b5e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Ouvrir le tableau de bord</a>` : ""}
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Digest automatique · flowise.</p>
</div>`;
}
