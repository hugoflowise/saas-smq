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
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { RevueDialog } from "./revue-dialog";

const STATUT_LABELS: Record<string, string> = {
  planifiee: "Planifiée",
  realisee: "Réalisée",
  cloturee: "Clôturée",
};

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function RevuesDirectionPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Revues de direction" description="Revues annuelles de direction." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: revues } = await supabase
    .from("revues_direction")
    .select("id, annee, date_realisation, statut, ordre_du_jour, conclusions, decisions")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("annee", { ascending: false });

  const items = revues ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Revues de direction"
        description="Revues annuelles de direction (ISO 9001 §9.3)."
      >
        <RevueDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune revue de direction"
          description="Planifiez la revue de direction annuelle."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Année</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.annee}</TableCell>
                  <TableCell>{formatDate(r.date_realisation)}</TableCell>
                  <TableCell>{STATUT_LABELS[r.statut] ?? r.statut}</TableCell>
                  <TableCell>
                    <RevueDialog revue={r} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
