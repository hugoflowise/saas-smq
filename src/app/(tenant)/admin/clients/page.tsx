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
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CreateTenantDialog } from "./create-tenant-dialog";
import { EditTenantDialog } from "./edit-tenant-dialog";

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
      "id, nom_societe, formule, statut, effectif_tranche, secteur, logo_url, responsable_flowise_id, created_at",
    )
    .order("created_at", { ascending: false });

  // Équipe Flowise (admin Flowise) : candidats au rôle de Responsable Qualité.
  const { data: equipeFlowise } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin_flowise")
    .order("full_name");
  const flowiseTeam = (equipeFlowise ?? []).map((m) => ({
    id: m.id,
    nom: m.full_name?.trim() || m.email,
  }));

  // Dirigeant de chaque tenant
  const tenantIds = (tenants ?? []).map((t) => t.id);
  const { data: dirigeants } = await admin
    .from("profiles")
    .select("id, full_name, email, tenant_id")
    .eq("role", "dirigeant")
    .in("tenant_id", tenantIds.length > 0 ? tenantIds : ["00000000-0000-0000-0000-000000000000"]);

  const dirigeantByTenant = new Map(
    (dirigeants ?? []).filter((d) => d.tenant_id).map((d) => [d.tenant_id as string, d]),
  );

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
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => {
                const dirigeant = dirigeantByTenant.get(t.id) ?? null;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nom_societe}</TableCell>
                    <TableCell>
                      {dirigeant ? (
                        <span className="flex flex-col">
                          <span>{dirigeant.full_name ?? "-"}</span>
                          <span className="text-muted-foreground text-xs">{dirigeant.email}</span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{t.effectif_tranche ?? "-"}</TableCell>
                    <TableCell>{t.secteur ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.statut}</Badge>
                    </TableCell>
                    <TableCell>
                      <EditTenantDialog
                        flowiseTeam={flowiseTeam}
                        tenant={{
                          id: t.id,
                          nom_societe: t.nom_societe,
                          effectif_tranche: t.effectif_tranche,
                          secteur: t.secteur,
                          logo_url: t.logo_url,
                          responsable_flowise_id: t.responsable_flowise_id,
                        }}
                        dirigeant={
                          dirigeant
                            ? {
                                id: dirigeant.id,
                                full_name: dirigeant.full_name,
                                email: dirigeant.email,
                              }
                            : null
                        }
                      />
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
    </div>
  );
}
