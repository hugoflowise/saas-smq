import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nomPersonne } from "@/lib/format";
import { SECTEUR_LABELS } from "@/lib/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CreateTenantDialog } from "./create-tenant-dialog";
import { DeleteTenantDialog } from "./delete-tenant-dialog";
import { EditTenantDialog } from "./edit-tenant-dialog";
import { ManageDirigeantsDialog } from "./manage-dirigeants-dialog";
import { RestoreTenantButton } from "./restore-tenant-button";

function secteurLabel(s: string | null): string {
  if (!s) return "-";
  return SECTEUR_LABELS[s as keyof typeof SECTEUR_LABELS] ?? s;
}

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Garde : rôle lu en base (fiable même si le JWT n'est pas encore rafraîchi)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (profile?.role !== "admin_flowise") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: tenants } = await admin
    .from("tenants")
    .select(
      "id, nom_societe, formule, statut, effectif_tranche, secteur, bureau_etudes, logo_url, responsable_flowise_id, created_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Corbeille : clients supprimés (réversible)
  const { data: deletedTenants } = await admin
    .from("tenants")
    .select("id, nom_societe, secteur, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  const corbeille = deletedTenants ?? [];

  // Équipe Flowise (admin Flowise) : candidats au rôle de Responsable Qualité.
  const { data: equipeFlowise } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin_flowise")
    .order("full_name");
  const flowiseTeam = (equipeFlowise ?? []).map((m) => ({
    id: m.id,
    nom: nomPersonne(m.full_name, m.email),
  }));

  // Dirigeants de chaque tenant (plusieurs possibles)
  const tenantIds = (tenants ?? []).map((t) => t.id);
  const { data: dirigeants } = await admin
    .from("profiles")
    .select("id, full_name, email, tenant_id")
    .eq("role", "dirigeant")
    .in("tenant_id", tenantIds.length > 0 ? tenantIds : ["00000000-0000-0000-0000-000000000000"])
    .order("full_name");

  const dirigeantsByTenant = new Map<
    string,
    { id: string; full_name: string | null; email: string }[]
  >();
  for (const d of dirigeants ?? []) {
    if (!d.tenant_id) continue;
    const list = dirigeantsByTenant.get(d.tenant_id) ?? [];
    list.push({ id: d.id, full_name: d.full_name, email: d.email });
    dirigeantsByTenant.set(d.tenant_id, list);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Clients" description="Gestion des sociétés clientes (tenants) Flowise.">
        <CreateTenantDialog />
      </PageHeader>

      {tenants && tenants.length > 0 ? (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Société</TableHead>
                <TableHead>Dirigeant</TableHead>
                <TableHead>Effectif</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => {
                const tenantDirigeants = dirigeantsByTenant.get(t.id) ?? [];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nom_societe}</TableCell>
                    <TableCell>
                      {tenantDirigeants.length > 0 ? (
                        <span className="flex flex-col gap-1">
                          {tenantDirigeants.map((d) => (
                            <span key={d.id} className="flex flex-col">
                              <span>{d.full_name ?? "-"}</span>
                              <span className="text-muted-foreground text-xs">{d.email}</span>
                            </span>
                          ))}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{t.effectif_tranche ?? "-"}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        {secteurLabel(t.secteur)}
                        {t.bureau_etudes ? (
                          <Badge variant="outline" className="text-xs">
                            BE
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.statut}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ManageDirigeantsDialog
                          tenantId={t.id}
                          nomSociete={t.nom_societe}
                          dirigeants={tenantDirigeants}
                        />
                        <EditTenantDialog
                          flowiseTeam={flowiseTeam}
                          tenant={{
                            id: t.id,
                            nom_societe: t.nom_societe,
                            effectif_tranche: t.effectif_tranche,
                            secteur: t.secteur,
                            bureau_etudes: t.bureau_etudes,
                            logo_url: t.logo_url,
                            responsable_flowise_id: t.responsable_flowise_id,
                          }}
                        />
                        <DeleteTenantDialog tenantId={t.id} nomSociete={t.nom_societe} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="Aucun client"
          description="Créez votre première société cliente pour commencer."
        />
      )}

      {corbeille.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold text-muted-foreground text-sm">
            Corbeille ({corbeille.length})
          </h2>
          <div className="rounded-2xl border bg-card">
            <Table>
              <TableBody>
                {corbeille.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nom_societe}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {secteurLabel(t.secteur)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RestoreTenantButton tenantId={t.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
