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
import { formatDate, nomPersonne } from "@/lib/format";
import { RETOUR_STATUT_LABELS, RETOUR_TYPE_LABELS } from "@/lib/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { RetourDialog } from "./retour-dialog";

const STATUT_VARIANT: Record<string, "secondary" | "outline"> = {
  nouveau: "secondary",
  en_cours: "secondary",
  traite: "outline",
  rejete: "outline",
};

export default async function AdminRetoursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  if (profile?.role !== "admin_flowise") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: retoursData } = await admin
    .from("retours")
    .select(
      "id, tenant_id, type, titre, description, page_url, statut, note_admin, created_at, created_by",
    )
    .order("created_at", { ascending: false });
  const retours = retoursData ?? [];

  // Auteurs + sociétés (pour le contexte)
  const authorIds = [...new Set(retours.map((r) => r.created_by).filter(Boolean) as string[])];
  const tenantIds = [...new Set(retours.map((r) => r.tenant_id).filter(Boolean) as string[])];
  const fallback = ["00000000-0000-0000-0000-000000000000"];
  const [{ data: authors }, { data: tenants }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", authorIds.length ? authorIds : fallback),
    admin
      .from("tenants")
      .select("id, nom_societe")
      .in("id", tenantIds.length ? tenantIds : fallback),
  ]);
  const authorById = new Map((authors ?? []).map((a) => [a.id, a]));
  const tenantById = new Map((tenants ?? []).map((t) => [t.id, t.nom_societe]));

  const nouveaux = retours.filter((r) => r.statut === "nouveau").length;
  const enCours = retours.filter((r) => r.statut === "en_cours").length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Retours"
        description="Bugs, remarques et demandes d'évolution remontés par les utilisateurs."
      />

      {retours.length === 0 ? (
        <EmptyState
          title="Aucun retour"
          description="Les retours envoyés depuis l'app (bouton « Faire un retour ») apparaîtront ici."
        />
      ) : (
        <>
          <div className="mb-4 flex gap-3 text-sm">
            <span className="rounded-lg border bg-card px-3 py-1.5">
              <strong>{nouveaux}</strong> nouveau{nouveaux > 1 ? "x" : ""}
            </span>
            <span className="rounded-lg border bg-card px-3 py-1.5">
              <strong>{enCours}</strong> en cours
            </span>
            <span className="rounded-lg border bg-card px-3 py-1.5">
              <strong>{retours.length}</strong> au total
            </span>
          </div>

          <div className="rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retours.map((r) => {
                  const author = r.created_by ? authorById.get(r.created_by) : null;
                  const auteurNom = author ? nomPersonne(author.full_name, author.email) : "—";
                  const clientNom = r.tenant_id ? (tenantById.get(r.tenant_id) ?? null) : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {RETOUR_TYPE_LABELS[r.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="block truncate font-medium">{r.titre}</span>
                        {r.page_url ? (
                          <span className="block truncate font-mono text-muted-foreground text-xs">
                            {r.page_url}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span className="block">{auteurNom}</span>
                        {clientNom ? (
                          <span className="block text-muted-foreground text-xs">{clientNom}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUT_VARIANT[r.statut] ?? "secondary"}>
                          {RETOUR_STATUT_LABELS[r.statut]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <RetourDialog
                          retour={{
                            id: r.id,
                            type: RETOUR_TYPE_LABELS[r.type],
                            titre: r.titre,
                            description: r.description,
                            pageUrl: r.page_url,
                            statut: r.statut,
                            noteAdmin: r.note_admin,
                            auteur: auteurNom,
                            client: clientNom,
                            date: formatDate(r.created_at),
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
