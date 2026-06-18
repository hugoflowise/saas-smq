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
import { AUDIT_TYPE_BADGE_CLASS, BADGE_BASE } from "@/lib/badges";
import { AUDIT_STATUT_LABELS, AUDIT_TYPE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { AuditDialog } from "./audit-dialog";

const FILTERS = [
  { value: "tous", label: "Tous" },
  { value: "interne", label: "Internes" },
  { value: "externe", label: "Externes" },
  { value: "fournisseur", label: "Fournisseurs" },
] as const;

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = FILTERS.some((f) => f.value === type) ? type : "tous";

  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Audits" description="Planification et rapports d'audit." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("audits_internes")
    .select(
      "id, reference, type_audit, organisme, perimetre, date_prevue, date_realisee, duree_prevue, statut",
    )
    .eq("tenant_id", ctx.effectiveTenantId);
  if (activeType !== "tous") {
    query = query.eq("type_audit", activeType as "interne" | "externe" | "fournisseur");
  }
  const { data: audits } = await query.order("date_prevue", {
    ascending: false,
    nullsFirst: false,
  });

  const items = audits ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Audits"
        description="Audits internes (ISO 9001 §9.2), externes (certification/client) et fournisseurs."
      >
        <AuditDialog />
      </PageHeader>

      <div className="mb-4 flex gap-1 rounded-lg border bg-card p-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "tous" ? "/audits" : `/audits?type=${f.value}`}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              activeType === f.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun audit"
          description="Planifiez un audit : tous les processus doivent être audités en interne sur 3 ans."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Périmètre / Organisme</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    <Link href={`/audits/${a.id}`} className="hover:text-primary hover:underline">
                      {a.reference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`${BADGE_BASE} ${
                        AUDIT_TYPE_BADGE_CLASS[a.type_audit] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {AUDIT_TYPE_LABELS[a.type_audit as keyof typeof AUDIT_TYPE_LABELS] ??
                        a.type_audit}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/audits/${a.id}`} className="hover:text-primary hover:underline">
                      {a.perimetre ?? a.organisme ?? "À renseigner"}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(a.date_prevue)}</TableCell>
                  <TableCell>
                    {AUDIT_STATUT_LABELS[a.statut as keyof typeof AUDIT_STATUT_LABELS] ?? a.statut}
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
