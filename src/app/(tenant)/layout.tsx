import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { getActiveTenantId } from "@/lib/active-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  const { data: notifs } = user
    ? await supabase
        .from("notifications")
        .select("id, title, body, link, is_read, created_at")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15)
    : { data: [] };
  const notifications = notifs ?? [];
  const { count: unreadCount } = user
    ? await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_user_id", user.id)
        .eq("is_read", false)
    : { count: 0 };

  const email = profile?.email ?? user?.email ?? "";
  const role = profile?.role ?? "-";
  const isAdmin = role === "admin_flowise";

  let tenants: { id: string; nom: string }[] = [];
  let activeTenantId: string | null = null;
  let activeTenantName: string | null = null;

  if (isAdmin) {
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          email={email}
          role={role}
          isAdmin={isAdmin}
          tenants={tenants}
          activeTenantId={activeTenantId}
          activeTenantName={activeTenantName}
          notifications={notifications}
          unreadCount={unreadCount ?? 0}
        />
        <main className="app-bg flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full min-w-0 max-w-screen-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
