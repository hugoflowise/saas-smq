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
import { AuditDialog } from "./audit-dialog";

const STATUT_LABELS: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  realise: "Réalisé",
  rapport_redige: "Rapport rédigé",
  cloture: "Clôturé",
};

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function AuditsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Audits internes" description="Planification et rapports d'audit." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: audits } = await supabase
    .from("audits_internes")
    .select(
      "id, reference, perimetre, date_prevue, date_realisee, duree_prevue, statut, rapport, ecarts_constates",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_prevue", { ascending: false, nullsFirst: false });

  const items = audits ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Audits internes"
        description="Planification et rapports d'audit (ISO 9001 §9.2)."
      >
        <AuditDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun audit"
          description="Planifiez un audit interne : tous les processus doivent être audités sur 3 ans."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf.</TableHead>
                <TableHead>Périmètre</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {a.reference}
                  </TableCell>
                  <TableCell className="font-medium">{a.perimetre ?? "—"}</TableCell>
                  <TableCell>{formatDate(a.date_prevue)}</TableCell>
                  <TableCell>{STATUT_LABELS[a.statut] ?? a.statut}</TableCell>
                  <TableCell>
                    <AuditDialog audit={a} />
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
