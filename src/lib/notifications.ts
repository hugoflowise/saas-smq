import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { Database } from "./supabase/database.types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

/**
 * Crée une notification in-app pour tous les utilisateurs d'un tenant.
 * Insertion via service_role (la table notifications n'autorise pas l'insert
 * aux utilisateurs authentifiés). À appeler depuis une Server Action.
 */
export async function notifyTenant(
  tenantId: string,
  notif: { type: NotificationType; title: string; body?: string; link?: string },
): Promise<void> {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id").eq("tenant_id", tenantId);
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
}
