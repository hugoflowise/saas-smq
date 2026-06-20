import "server-only";
import { emailConfigured, notificationEmailHtml, sendEmail } from "./email";
import { wantsEmail } from "./notification-preferences";
import { createAdminClient } from "./supabase/admin";
import type { Database } from "./supabase/database.types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

/**
 * Crée une notification pour tous les utilisateurs d'un tenant :
 * - toujours une notification **in-app** (insérée via service_role, car la
 *   table notifications n'autorise pas l'insert aux utilisateurs authentifiés) ;
 * - et, si l'envoi d'e-mails est configuré (clé Resend), un **e-mail** aux
 *   destinataires qui n'ont pas désactivé l'option (best-effort, non bloquant).
 *
 * À appeler depuis une Server Action.
 */
export async function notifyTenant(
  tenantId: string,
  notif: { type: NotificationType; title: string; body?: string; link?: string },
): Promise<void> {
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, notification_preferences")
    .eq("tenant_id", tenantId);
  if (!profiles || profiles.length === 0) return;

  await admin.from("notifications").insert(
    profiles.map((p) => ({
      tenant_id: tenantId,
      recipient_user_id: p.id,
      type: notif.type,
      title: notif.title,
      body: notif.body ?? null,
      link: notif.link ?? null,
    })),
  );

  // E-mail best-effort : ignoré silencieusement si Resend n'est pas configuré.
  if (!emailConfigured()) return;
  const destinataires = profiles
    .filter((p) => p.email && wantsEmail(p.notification_preferences))
    .map((p) => p.email);
  if (destinataires.length === 0) return;

  const html = notificationEmailHtml(notif);
  await Promise.allSettled(
    destinataires.map((to) => sendEmail({ to, subject: notif.title, html })),
  );
}
