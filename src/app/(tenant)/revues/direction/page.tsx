import Link from "next/link";
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
import { formatDate } from "@/lib/format";
import { REVUE_STATUT_LABELS as STATUT_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { RevueDialog } from "./revue-dialog";

export default async function RevuesDirectionPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
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
    <div className="w-full">
      <PageHeader
        title="Revues de direction"
        description="Revues annuelles de direction."
        concept="revue"
        help="À intervalles planifiés, la direction revoit la performance du SMQ et des processus (objectifs vs résultats, NC, audits, satisfaction, risques) et décide des actions et ressources."
      >
        <RevueDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune revue de direction"
          description="Planifiez la revue de direction annuelle."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Année</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/revues/direction/${r.id}`} className={ROW_NAME_BUTTON}>
                      {r.annee}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(r.date_realisation)}</TableCell>
                  <TableCell>
                    {STATUT_LABELS[r.statut as keyof typeof STATUT_LABELS] ?? r.statut}
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
