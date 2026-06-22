import { getActiveTenantId } from "./active-tenant";
import { createClient } from "./supabase/server";

export type TenantContext = {
  userId: string | null;
  role: string;
  isAdmin: boolean;
  /**
   * Tenant sur lequel l'utilisateur travaille :
   * - admin Flowise : le tenant actif (cookie), null s'il n'en a pas choisi
   * - dirigeant/manager : son propre tenant
   * Tous les accès aux données des modules DOIVENT filtrer sur cet id.
   */
  effectiveTenantId: string | null;
};

export async function getTenantContext(): Promise<TenantContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const role = profile?.role ?? "-";
  const isAdmin = role === "admin_flowise";
  const effectiveTenantId = isAdmin ? await getActiveTenantId() : (profile?.tenant_id ?? null);

  return { userId: user?.id ?? null, role, isAdmin, effectiveTenantId };
}
