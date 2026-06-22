import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "./change-password-form";

/** Page « Mon compte » : infos de l'utilisateur connecté et changement de mot de passe. */
export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const email = profile?.email ?? user?.email ?? "";
  const role = profile?.role ?? null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Mon compte" description="Vos informations et votre mot de passe." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {profile?.full_name ? (
            <p>
              <span className="text-muted-foreground">Nom : </span>
              {profile.full_name}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">E-mail : </span>
            {email}
          </p>
          <p>
            <span className="text-muted-foreground">Rôle : </span>
            {role ? (ROLE_LABELS[role] ?? role) : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
