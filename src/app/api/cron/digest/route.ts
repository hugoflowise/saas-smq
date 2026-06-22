import { NextResponse } from "next/server";
import { aDesAlertes, collectEcheances } from "@/lib/echeances";
import { digestEmailHtml, emailConfigured, sendEmail } from "@/lib/email";
import { formatDate } from "@/lib/format";
import { wantsEmail } from "@/lib/notification-preferences";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Digest quotidien des échéances qualité (envoi e-mail).
 *
 * Déclenché par un Cron Vercel (voir `vercel.json` : tous les lundis ~6h UTC).
 * Pour chaque tenant, agrège
 * les actions en retard, les échéances à venir (30 j) et les documents à réviser,
 * puis envoie un récapitulatif par e-mail aux membres qui n'ont pas désactivé
 * l'option. Les tenants sans rien à signaler sont ignorés (pas d'e-mail vide).
 *
 * Sécurité : si `CRON_SECRET` est défini, on exige l'en-tête
 * `Authorization: Bearer <CRON_SECRET>` (Vercel l'ajoute automatiquement aux
 * appels Cron). Sans e-mail configuré (Resend), la route ne fait rien.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
    }
  }

  if (!emailConfigured()) {
    return NextResponse.json({ ok: true, skipped: "email_non_configure", envoyes: 0 });
  }

  const admin = createAdminClient();
  const { data: tenants } = await admin.from("tenants").select("id, nom_societe");
  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ ok: true, envoyes: 0, tenants: 0 });
  }

  // Superviseurs : reçoivent le digest de CHAQUE client (suivi global).
  // = tous les admins Flowise + les adresses listées dans DIGEST_SUPERVISORS
  // (séparées par des virgules). Pratique pour Léa + Hugo tant que les clients
  // n'ont pas encore accès à l'app.
  const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin_flowise");
  const superviseurs = new Set<string>();
  for (const a of admins ?? []) if (a.email) superviseurs.add(a.email);
  for (const e of (process.env.DIGEST_SUPERVISORS ?? "").split(","))
    if (e.trim()) superviseurs.add(e.trim());

  let envoyes = 0;
  let tenantsAvecAlertes = 0;

  for (const tenant of tenants) {
    const data = await collectEcheances(admin, tenant.id, 30);
    if (!aDesAlertes(data)) continue;
    tenantsAvecAlertes++;

    // Destinataires = superviseurs (toujours) + éventuellement les membres du
    // tenant. L'envoi aux membres n'est activé que si DIGEST_INCLUDE_TENANT_MEMBERS
    // vaut "true" (désactivé tant que les clients n'ont pas de vrais comptes,
    // pour éviter d'envoyer à des adresses de test).
    const membres: string[] = [];
    if (process.env.DIGEST_INCLUDE_TENANT_MEMBERS === "true") {
      const { data: profiles } = await admin
        .from("profiles")
        .select("email, notification_preferences")
        .eq("tenant_id", tenant.id);
      for (const p of profiles ?? []) {
        if (p.email && wantsEmail(p.notification_preferences)) membres.push(p.email);
      }
    }
    const destinataires = [...new Set([...membres, ...superviseurs])];
    if (destinataires.length === 0) continue;

    const html = digestEmailHtml({
      dateFr: formatDate,
      sections: [
        {
          titre: "⚠️ Actions en retard",
          accent: "#dc2626",
          lignes: data.actionsRetard.map((a) => ({
            date: a.date,
            label: a.reference ? `${a.reference} · ${a.label}` : a.label,
            href: `/actions/${a.id}`,
          })),
        },
        {
          titre: "📅 Échéances à venir (30 jours)",
          accent: "#ff6b5e",
          lignes: data.echeances.map((e) => ({ date: e.date, label: e.label, href: e.href })),
        },
        {
          titre: "📄 Documents à réviser",
          accent: "#d97706",
          lignes: data.docsAReviser.map((d) => ({
            date: d.date,
            label: d.code ? `${d.code} · ${d.titre}` : d.titre,
            href: "/documents",
          })),
        },
      ],
    });

    const subject = `Échéances qualité — ${tenant.nom_societe}`;
    const results = await Promise.allSettled(
      destinataires.map((to) => sendEmail({ to, subject, html })),
    );
    envoyes += results.filter((r) => r.status === "fulfilled" && r.value === true).length;
  }

  return NextResponse.json({
    ok: true,
    tenants: tenants.length,
    tenantsAvecAlertes,
    envoyes,
  });
}
