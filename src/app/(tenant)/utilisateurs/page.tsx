import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageUsers, ROLE_MEMBRE_LABELS } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, IS_STAGING } from "@/lib/tenant-context";
import { IdentitesTestButton } from "./identites-test-button";
import { InviteDialog } from "./invite-dialog";
import { MembreRoleSelect, RemoveMembreButton } from "./membre-actions";

export default async function UtilisateursPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Utilisateurs" description="Gérez les accès à votre espace qualité." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut de la page."
        />
      </div>
    );
  }

  if (!canManageUsers(ctx.role)) {
    return (
      <div className="w-full">
        <PageHeader title="Utilisateurs" description="Gérez les accès à votre espace qualité." />
        <EmptyState
          title="Accès réservé"
          description="Seul le dirigeant peut gérer les utilisateurs de l'organisation."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: membres } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("role", { ascending: true })
    .order("email", { ascending: true });

  const items = membres ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Utilisateurs"
        description="Invitez vos collègues et gérez leurs accès à l'espace qualité."
        help="Le dirigeant invite des utilisateurs par e-mail et leur attribue un rôle : dirigeant (tout, y compris validation), manager (contribue sans valider) ou auditeur (lecture seule). Le retrait révoque l'accès sans supprimer le compte."
      >
        {IS_STAGING && ctx.realIsAdmin ? <IdentitesTestButton /> : null}
        <InviteDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun utilisateur"
          description="Invitez votre premier collègue avec le bouton ci-dessus."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => {
                const isSelf = m.id === ctx.userId;
                const label = m.full_name || m.email;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.full_name || "-"}
                      {isSelf ? (
                        <span className="ml-2 text-muted-foreground text-xs">(vous)</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.email}</TableCell>
                    <TableCell>
                      {isSelf ? (
                        <span className="text-sm">{ROLE_MEMBRE_LABELS[m.role] ?? m.role}</span>
                      ) : (
                        <MembreRoleSelect userId={m.id} role={m.role} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? null : <RemoveMembreButton userId={m.id} label={label} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
