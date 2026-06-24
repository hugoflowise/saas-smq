import type { NotificationItem } from "@/components/layout/notification-bell";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { LegalFooter } from "@/components/legal-footer";
import { getActiveTenantId } from "@/lib/active-tenant";
import { ReadOnlyProvider } from "@/lib/hooks/read-only-context";
import { canManageUsers, isReadOnly } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSimulatedRole } from "@/lib/view-as-cookie";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, tenant_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const email = profile?.email ?? user?.email ?? "";
  const realRole = profile?.role ?? "-";
  const realIsAdmin = realRole === "admin_flowise";

  // Vue simulée (admin uniquement) : affiche l'app sous un autre rôle.
  const simulatedRole = realIsAdmin ? await getSimulatedRole() : null;
  const simulating = Boolean(simulatedRole);
  const role = simulatedRole ?? realRole; // rôle affiché
  const isAdmin = realIsAdmin && !simulating; // admin « effectif » (nav, switcher)

  let tenants: { id: string; nom: string }[] = [];
  let activeTenantId: string | null = null;
  let activeTenantName: string | null = null;

  if (realIsAdmin) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("tenants")
      .select("id, nom_societe")
      .order("nom_societe", { ascending: true });
    tenants = (data ?? []).map((t) => ({ id: t.id, nom: t.nom_societe }));
    activeTenantId = await getActiveTenantId();
    activeTenantName = tenants.find((t) => t.id === activeTenantId)?.nom ?? null;
  } else if (profile?.tenant_id) {
    activeTenantId = profile.tenant_id;
    const { data: tenant } = await supabase
      .from("tenants")
      .select("nom_societe")
      .eq("id", profile.tenant_id)
      .maybeSingle();
    activeTenantName = tenant?.nom_societe ?? null;
  }

  // Notifications. En vue simulée, l'admin voit celles adressées au rôle simulé
  // dans le client actif (pour vérifier que les notifications fonctionnent) ;
  // sinon, ses propres notifications.
  const COLS = "id, title, body, link, is_read, created_at";
  let notifications: NotificationItem[] = [];
  let unreadCount = 0;
  if (simulating && simulatedRole && activeTenantId) {
    const admin = createAdminClient();
    const { data: roleUsers } = await admin
      .from("profiles")
      .select("id")
      .eq("tenant_id", activeTenantId)
      .eq("role", simulatedRole);
    const ids = (roleUsers ?? []).map((u) => u.id);
    if (ids.length > 0) {
      const { data } = await admin
        .from("notifications")
        .select(COLS)
        .in("recipient_user_id", ids)
        .order("created_at", { ascending: false })
        .limit(15);
      notifications = data ?? [];
      const { count } = await admin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .in("recipient_user_id", ids)
        .eq("is_read", false);
      unreadCount = count ?? 0;
    }
  } else if (user) {
    const { data } = await supabase
      .from("notifications")
      .select(COLS)
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);
    notifications = data ?? [];
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", user.id)
      .eq("is_read", false);
    unreadCount = count ?? 0;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAdmin={isAdmin} canManageUsers={canManageUsers(role)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          email={email}
          role={role}
          isAdmin={isAdmin}
          canSimulate={realIsAdmin}
          simulating={simulating}
          canManageUsers={canManageUsers(role)}
          tenants={tenants}
          activeTenantId={activeTenantId}
          activeTenantName={activeTenantName}
          notifications={notifications}
          unreadCount={unreadCount ?? 0}
        />
        <main className="app-bg flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full min-w-0 max-w-screen-2xl">
            {isReadOnly(role) ? (
              <div className="mb-6 rounded-lg border border-status-pa/40 bg-status-pa/10 px-4 py-2.5 text-sm text-status-pa">
                Mode lecture seule : le rôle auditeur permet de consulter le système qualité mais
                pas de le modifier.
              </div>
            ) : null}
            <ReadOnlyProvider value={isReadOnly(role)}>{children}</ReadOnlyProvider>
            <LegalFooter className="mt-10 border-t pt-6 print:hidden" />
          </div>
        </main>
      </div>
    </div>
  );
}
