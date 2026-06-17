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

  const email = profile?.email ?? user?.email ?? "";
  const role = profile?.role ?? "—";
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
    <div className="flex flex-1">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col">
        <TopBar
          email={email}
          role={role}
          isAdmin={isAdmin}
          tenants={tenants}
          activeTenantId={activeTenantId}
          activeTenantName={activeTenantName}
        />
        <main className="flex-1 overflow-y-auto bg-surface px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
