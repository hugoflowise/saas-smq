import { getActiveTenantId } from "./active-tenant";
import { createClient } from "./supabase/server";
import { getSimulatedRole } from "./view-as-cookie";

// Environnement de staging (identifié par le projet Supabase). Certaines aides
// au test - comme l'identité simulée (agir sous un vrai utilisateur du tenant en
// vue manager/dirigeant) - n'y sont activées QUE là, jamais en production.
export const IS_STAGING = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").includes(
  "bsiwwzfundeueiirufmn",
);

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
  let userId = user?.id ?? null;
  if (realIsAdmin) {
    const simulatedRole = await getSimulatedRole();
    if (simulatedRole) {
      role = simulatedRole;
      isAdmin = false;
      simulating = true;

      // STAGING uniquement : en vue manager/dirigeant, l'admin agit sous
      // l'identité d'un utilisateur réel du tenant ayant ce rôle. Cela permet de
      // dérouler un circuit complet rédacteur ≠ vérificateur ≠ approbateur (et
      // de tester les signatures) avec un seul compte admin. En prod, on ne
      // touche jamais à `userId` (l'attribution created_by/signataire reste
      // l'admin).
      if (
        IS_STAGING &&
        effectiveTenantId &&
        (simulatedRole === "manager" || simulatedRole === "dirigeant")
      ) {
        const { data: personas } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("tenant_id", effectiveTenantId)
          .eq("role", simulatedRole)
          .limit(50);
        // On privilégie un profil dédié « … flowise » (par nom ou e-mail) s'il
        // existe, sinon le premier utilisateur réel de ce rôle dans le tenant.
        const persona =
          (personas ?? []).find((p) =>
            `${p.full_name ?? ""} ${p.email ?? ""}`.toLowerCase().includes("flowise"),
          ) ?? (personas ?? [])[0];
        if (persona) userId = persona.id;
      }
    }
  }

  return {
    userId,
    role,
    isAdmin,
    realRole,
    realIsAdmin,
    simulating,
    effectiveTenantId,
  };
}
