import "server-only";
import { getActiveTenantId } from "./active-tenant";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";
import { getSimulatedRole } from "./view-as-cookie";

export type NotifRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const COLS = "id, title, body, link, is_read, created_at";

/**
 * Charge les notifications à afficher (cloche + page), avec la MÊME logique
 * partout : en vue simulée (admin prévisualisant un rôle), on montre les
 * notifications adressées à ce rôle dans le client actif ; sinon, celles de
 * l'utilisateur connecté.
 */
export async function loadNotifications(
  limit = 15,
): Promise<{ notifications: NotifRow[]; unreadCount: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const simulatedRole = profile?.role === "admin_flowise" ? await getSimulatedRole() : null;

  if (simulatedRole) {
    const activeTenantId = await getActiveTenantId();
    if (!activeTenantId) return { notifications: [], unreadCount: 0 };
    const admin = createAdminClient();
    const { data: roleUsers } = await admin
      .from("profiles")
      .select("id")
      .eq("tenant_id", activeTenantId)
      .eq("role", simulatedRole);
    const ids = (roleUsers ?? []).map((u) => u.id);
    if (ids.length === 0) return { notifications: [], unreadCount: 0 };
    const { data } = await admin
      .from("notifications")
      .select(COLS)
      .in("recipient_user_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .in("recipient_user_id", ids)
      .eq("is_read", false);
    return { notifications: data ?? [], unreadCount: count ?? 0 };
  }

  const { data } = await supabase
    .from("notifications")
    .select(COLS)
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", user.id)
    .eq("is_read", false);
  return { notifications: data ?? [], unreadCount: count ?? 0 };
}
