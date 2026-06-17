import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, tenant_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={`Bonjour ${profile?.full_name ?? profile?.email ?? ""}`}
        description="Vue d'ensemble de votre Système de Management de la Qualité."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre compte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{profile?.email ?? user?.email}</Badge>
          <Badge variant="secondary">rôle : {profile?.role ?? "—"}</Badge>
          <Badge variant="secondary">
            tenant : {profile?.tenant_id ?? "aucun (admin Flowise)"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
