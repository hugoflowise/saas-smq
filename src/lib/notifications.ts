import "server-only";
import { emailConfigured, notificationEmailHtml, sendEmail } from "./email";
import { wantsEmail } from "./notification-preferences";
import { createAdminClient } from "./supabase/admin";
import type { Database } from "./supabase/database.types";

type NotificationType = Database["public"]["Enums"]["notification_type"];
type Notif = { type: NotificationType; title: string; body?: string; link?: string };
type Destinataire = {
  id: string;
  email: string | null;
  tenant_id: string | null;
  notification_preferences: unknown;
};

/**
 * Envoie une notification à une liste de destinataires :
 * - toujours une notification **in-app** (insérée via service_role) ;
 * - et un **e-mail** aux destinataires qui ne l'ont pas désactivé, si Resend
 *   est configuré (best-effort, non bloquant).
 */
async function dispatch(
  destinataires: Destinataire[],
  notif: Notif,
  options?: { inAppOnly?: boolean },
): Promise<void> {
  if (destinataires.length === 0) return;
  const admin = createAdminClient();

  await admin.from("notifications").insert(
    destinataires.map((p) => ({
      tenant_id: p.tenant_id,
      recipient_user_id: p.id,
      type: notif.type,
      title: notif.title,
      body: notif.body ?? null,
      link: notif.link ?? null,
    })),
  );

  if (options?.inAppOnly || !emailConfigured()) return;
  const emails = destinataires
    .filter((p) => p.email && wantsEmail(p.notification_preferences))
    .map((p) => p.email as string);
  if (emails.length === 0) return;

  const html = notificationEmailHtml(notif);
  await Promise.allSettled(emails.map((to) => sendEmail({ to, subject: notif.title, html })));
}

/** Notifie tous les utilisateurs d'un client. */
export async function notifyTenant(tenantId: string, notif: Notif): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, tenant_id, notification_preferences")
    .eq("tenant_id", tenantId);
  await dispatch(data ?? [], notif);
}

/** Notifie les utilisateurs d'un client ayant l'un des rôles indiqués. */
export async function notifyRole(tenantId: string, roles: string[], notif: Notif): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, tenant_id, notification_preferences")
    .eq("tenant_id", tenantId)
    .in("role", roles as Database["public"]["Enums"]["user_role"][]);
  await dispatch(data ?? [], notif);
}

/** Notifie des utilisateurs précis (par identifiant). Ignore les valeurs vides. */
export async function notifyUsers(
  userIds: (string | null | undefined)[],
  notif: Notif,
  options?: { inAppOnly?: boolean },
): Promise<void> {
  const ids = [...new Set(userIds.filter(Boolean) as string[])];
  if (ids.length === 0) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, tenant_id, notification_preferences")
    .in("id", ids);
  await dispatch(data ?? [], notif, options);
}
