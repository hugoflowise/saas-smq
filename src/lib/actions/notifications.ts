"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import { getActiveTenantId } from "@/lib/active-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getSimulatedRole } from "@/lib/view-as-cookie";

/**
 * Contexte d'affichage des notifications : en vue simulée (admin prévisualisant
 * un rôle), on agit sur les notifications adressées à ce rôle dans le client
 * actif ; sinon, sur celles de l'utilisateur connecté.
 */
async function contexteNotifs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const simulatedRole = profile?.role === "admin_flowise" ? await getSimulatedRole() : null;
  return { supabase, userId: user.id, simulatedRole };
}

/** Identifiants des destinataires du rôle simulé dans le client actif. */
async function roleRecipientIds(role: string): Promise<string[]> {
  const tid = await getActiveTenantId();
  if (!tid) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("tenant_id", tid)
    .eq("role", role as Database["public"]["Enums"]["user_role"]);
  return (data ?? []).map((u) => u.id);
}

/** Marque toutes les notifications affichées comme lues. */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const ctx = await contexteNotifs();
  if (!ctx) return { ok: false, error: "Non authentifié." };

  if (ctx.simulatedRole) {
    const ids = await roleRecipientIds(ctx.simulatedRole);
    if (ids.length > 0) {
      const admin = createAdminClient();
      const { error } = await admin
        .from("notifications")
        .update({ is_read: true })
        .in("recipient_user_id", ids)
        .eq("is_read", false);
      if (error) return { ok: false, error: error.message };
    }
  } else {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_user_id", ctx.userId)
      .eq("is_read", false);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Marque une notification comme lue. */
export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const ctx = await contexteNotifs();
  if (!ctx) return { ok: false, error: "Non authentifié." };

  if (ctx.simulatedRole) {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("recipient_user_id", ctx.userId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
