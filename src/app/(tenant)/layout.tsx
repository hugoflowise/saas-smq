import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { LegalFooter } from "@/components/legal-footer";
import { TodoWidget } from "@/components/todo-widget";
import { getActiveTenantId } from "@/lib/active-tenant";
import { ReadOnlyProvider } from "@/lib/hooks/read-only-context";
import { systemeLabel } from "@/lib/normes-libelles";
import { loadNotifications } from "@/lib/notifications-view";
import { loadOnboarding } from "@/lib/onboarding";
import { canManageUsers, isReadOnly } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadTodosPerso } from "@/lib/todos";
import { getSimulatedRole } from "@/lib/view-as-cookie";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, tenant_id, must_set_password")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  // Accès bloqué tant que le mot de passe n'est pas défini (invitation / reset).
  if (profile?.must_set_password) redirect("/bienvenue");

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
  // Référentiels actifs du client courant : pilote l'affichage des modules.
  let normesActives: string[] = ["9001"];

  if (realIsAdmin) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("tenants")
      .select("id, nom_societe, normes_actives")
      .is("deleted_at", null)
      .order("nom_societe", { ascending: true });
    tenants = (data ?? []).map((t) => ({ id: t.id, nom: t.nom_societe }));
    activeTenantId = await getActiveTenantId();
    const active = (data ?? []).find((t) => t.id === activeTenantId);
    activeTenantName = active?.nom_societe ?? null;
    normesActives = active?.normes_actives ?? ["9001"];
  } else if (profile?.tenant_id) {
    activeTenantId = profile.tenant_id;
    const { data: tenant } = await supabase
      .from("tenants")
      .select("nom_societe, normes_actives")
      .eq("id", profile.tenant_id)
      .maybeSingle();
    activeTenantName = tenant?.nom_societe ?? null;
    normesActives = tenant?.normes_actives ?? ["9001"];
  }

  // Notifications (cloche) : logique partagée avec la page /notifications.
  const { notifications, unreadCount } = await loadNotifications(15);

  // « Mise en route » : masquée du menu une fois toutes les étapes terminées.
  const showOnboarding = activeTenantId ? !(await loadOnboarding(activeTenantId)).complete : true;

  // Pense-bête personnel (par utilisateur, indépendant du client actif).
  const todos = await loadTodosPerso();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isAdmin={isAdmin}
        canManageUsers={canManageUsers(role)}
        showOnboarding={showOnboarding}
        normesActives={normesActives}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          email={email}
          role={role}
          isAdmin={isAdmin}
          canSimulate={realIsAdmin}
          simulating={simulating}
          canManageUsers={canManageUsers(role)}
          showOnboarding={showOnboarding}
          normesActives={normesActives}
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
                Mode lecture seule : le rôle auditeur permet de consulter le{" "}
                {systemeLabel(normesActives)} mais pas de le modifier.
              </div>
            ) : null}
            <ReadOnlyProvider value={isReadOnly(role)}>{children}</ReadOnlyProvider>
            <LegalFooter className="mt-10 border-t pt-6 print:hidden" />
          </div>
        </main>
      </div>
      <TodoWidget initialTodos={todos} />
    </div>
  );
}
