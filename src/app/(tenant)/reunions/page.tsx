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
import { BADGE_BASE } from "@/lib/badges";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ReunionDialog } from "./reunion-dialog";

const TYPE_LABELS: Record<string, string> = {
  comite_qhse: "Comité QHSE",
  reunion_echange: "Réunion d'échange",
  revue: "Revue",
  autre: "Autre",
};

type Point = { statut?: string };

export default async function ReunionsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Réunions QHSE"
          description="Suivi et traçabilité des réunions qualité."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: reunions } = await supabase
    .from("reunions")
    .select("id, titre, type, date_prevue, date_realisation, statut, points")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_prevue", { ascending: false, nullsFirst: false });

  const items = reunions ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Réunions QHSE"
        description="Préparation, tenue, actions et comptes rendus des réunions qualité."
        isoClause="ISO 9001 §7.4 / §9.3"
        help="Centralisez vos réunions QHSE : préparez l'ordre du jour, saisissez discussions et décisions en séance, générez les actions et un compte rendu PDF. Traçabilité complète."
      >
        <ReunionDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune réunion"
          description="Créez une réunion : vous préparerez l'ordre du jour puis la compléterez en séance."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réunion</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Avancement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => {
                const points = (r.points ?? []) as Point[];
                const traites = points.filter((p) => p.statut === "traite").length;
                const date = r.date_realisation ?? r.date_prevue;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/reunions/${r.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {r.titre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {TYPE_LABELS[r.type] ?? r.type}
                    </TableCell>
                    <TableCell>{formatDate(date)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {points.length > 0 ? `${traites}/${points.length} points` : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${BADGE_BASE} ${
                          r.statut === "terminee"
                            ? "bg-status-conforme/15 text-status-conforme"
                            : "bg-status-pf/15 text-status-pf"
                        }`}
                      >
                        {r.statut === "terminee" ? "Terminée" : "Planifiée"}
                      </span>
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
