import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lecture du profil via RLS (l'utilisateur ne voit que le sien / son tenant).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, tenant_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Connecté en tant que <strong>{profile?.email ?? user?.email}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">rôle : {profile?.role ?? "—"}</Badge>
            <Badge variant="secondary">
              tenant : {profile?.tenant_id ?? "aucun (admin Flowise)"}
            </Badge>
          </div>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              Se déconnecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
