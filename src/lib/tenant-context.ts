import { getActiveTenantId } from "./active-tenant";
import { createClient } from "./supabase/server";
import { getSimulatedRole } from "./view-as-cookie";

export type TenantContext = {
  userId: string | null;
  /** Rôle effectif pour l'affichage : le rôle simulé si un admin prévisualise. */
  role: string;
  /** Vrai admin Flowise « en pouvoir » (faux pendant une vue simulée). */
  isAdmin: boolean;
  /** Rôle réel en base, indépendant de la simulation. */
  realRole: string;
  /** Vrai si l'utilisateur est réellement admin Flowise (même en vue simulée). */
  realIsAdmin: boolean;
  /** Vrai si un admin prévisualise actuellement l'app sous un autre rôle. */
  simulating: boolean;
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

  const realRole = profile?.role ?? "-";
  const realIsAdmin = realRole === "admin_flowise";
  // Le tenant effectif se résout toujours sur le rôle réel (l'admin choisit
  // un client via le cookie), même pendant une vue simulée.
  const effectiveTenantId = realIsAdmin ? await getActiveTenantId() : (profile?.tenant_id ?? null);

  // Vue simulée : un admin peut prévisualiser l'app sous un autre rôle. On
  // n'altère QUE l'affichage (rôle/isAdmin) ; les droits réels en base (RLS,
  // qui lit le JWT) restent ceux de l'admin.
  let role = realRole;
  let isAdmin = realIsAdmin;
  let simulating = false;
  if (realIsAdmin) {
    const simulatedRole = await getSimulatedRole();
    if (simulatedRole) {
      role = simulatedRole;
      isAdmin = false;
      simulating = true;
    }
  }

  return {
    userId: user?.id ?? null,
    role,
    isAdmin,
    realRole,
    realIsAdmin,
    simulating,
    effectiveTenantId,
  };
}
