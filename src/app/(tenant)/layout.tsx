import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const email = profile?.email ?? user?.email ?? "";
  const role = profile?.role ?? "—";

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar email={email} role={role} />
        <main className="flex-1 overflow-y-auto bg-surface px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
