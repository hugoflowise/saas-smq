import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CANAL_LABELS, CommunicationDialog, TYPE_LABELS } from "./communication-dialog";

export default async function CommunicationsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Communications"
          description="Communication interne et externe sur le SMQ."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const today = todayISO();
  const { data: communications } = await supabase
    .from("communications")
    .select("id, sujet, type, canal, audience, message, date_prevue, date_realisee, statut")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_prevue", { ascending: false, nullsFirst: false });

  const items = communications ?? [];
  const enRetard = (c: (typeof items)[number]) =>
    c.statut === "planifiee" && c.date_prevue != null && c.date_prevue < today;

  const total = items.length;
  const realisees = items.filter((c) => c.statut === "realisee").length;
  const retard = items.filter(enRetard).length;
  const tiles = [
    { label: "Total", value: total, cls: "text-foreground" },
    { label: "Planifiées", value: total - realisees, cls: "text-status-pf" },
    { label: "Réalisées", value: realisees, cls: "text-status-conforme" },
    { label: "En retard", value: retard, cls: "text-status-nc-mineure" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Communications"
        description="Communication interne et externe sur le SMQ."
        isoClause="ISO 9001 §7.4"
        help="Déterminez les communications internes et externes pertinentes pour le SMQ : sur quoi, quand, avec qui, comment et par qui communiquer. Suivez leur réalisation."
      >
        <CommunicationDialog />
      </PageHeader>

      {total > 0 ? <StatTiles tiles={tiles} className="mb-6" /> : null}

      {total === 0 ? (
        <EmptyState
          title="Aucune communication"
          description="Planifiez vos communications qualité (lancement de démarche, politique, résultats…)."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sujet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => {
                const late = enRetard(c);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.sujet}</TableCell>
                    <TableCell>{TYPE_LABELS[c.type] ?? c.type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {CANAL_LABELS[c.canal] ?? c.canal}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.audience ?? "-"}</TableCell>
                    <TableCell>{formatDate(c.date_prevue)}</TableCell>
                    <TableCell>
                      <span
                        className={`${BADGE_BASE} ${
                          c.statut === "realisee"
                            ? "bg-status-conforme/15 text-status-conforme"
                            : late
                              ? "bg-status-nc-mineure/15 text-status-nc-mineure"
                              : "bg-status-pf/15 text-status-pf"
                        }`}
                      >
                        {c.statut === "realisee" ? "Réalisée" : late ? "En retard" : "Planifiée"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <CommunicationDialog communication={c} />
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
