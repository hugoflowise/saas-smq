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
import { ACTION_PRIORITE_LABELS, ACTION_STATUT_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ActionDialog } from "./action-dialog";
import { FilterBar } from "./filter-bar";
import { ActionsKanban } from "./kanban";
import { ViewToggle } from "./view-toggle";

const STATUT_CLASS: Record<string, string> = {
  a_faire: "bg-muted text-foreground",
  en_cours: "bg-status-pf/15 text-status-pf",
  termine: "bg-status-conforme/15 text-status-conforme",
  bloquee: "bg-status-nc-mineure/15 text-status-nc-mineure",
  abandonnee: "bg-muted text-muted-foreground",
};

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; priorite?: string; tri?: string; vue?: string }>;
}) {
  const ctx = await getTenantContext();
  const { statut, priorite, tri, vue } = await searchParams;

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Plan d'actions"
          description="Suivi des actions d'amélioration, correctives et préventives."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour afficher son plan d'actions."
        />
      </div>
    );
  }

  const supabase = await createClient();

  const { data: processusOptions } = await supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("ordre_affichage", { ascending: true });

  let query = supabase
    .from("actions")
    .select(
      "id, reference, description_courte, description_detail, origine, type, priorite, statut, processus_concerne, date_prevue, indicateur_efficacite, commentaires",
    )
    .eq("tenant_id", ctx.effectiveTenantId);

  if (statut)
    query = query.eq(
      "statut",
      statut as "a_faire" | "en_cours" | "termine" | "bloquee" | "abandonnee",
    );
  if (priorite) query = query.eq("priorite", priorite as "p1" | "p2" | "p3");

  // Tri : par échéance (croissant/décroissant) ou par priorité (défaut)
  if (tri === "echeance_asc") {
    query = query.order("date_prevue", { ascending: true, nullsFirst: false });
  } else if (tri === "echeance_desc") {
    query = query.order("date_prevue", { ascending: false, nullsFirst: false });
  } else {
    query = query
      .order("priorite", { ascending: true })
      .order("date_prevue", { ascending: true, nullsFirst: false });
  }

  const { data: actions } = await query;

  const items = actions ?? [];
  const options = processusOptions ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Plan d'actions"
        description="Suivi des actions d'amélioration, correctives et préventives."
      >
        <ViewToggle />
        <ActionDialog processusOptions={options} />
      </PageHeader>

      <FilterBar />

      {items.length === 0 ? (
        <EmptyState title="Aucune action" description="Créez une action ou ajustez les filtres." />
      ) : vue === "kanban" ? (
        <ActionsKanban key={`${statut ?? ""}|${priorite ?? ""}`} initial={items} />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf.</TableHead>
                <TableHead>Intitulé</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Échéance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    <Link href={`/actions/${a.id}`} className="hover:text-primary hover:underline">
                      {a.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/actions/${a.id}`} className="hover:text-primary hover:underline">
                      {a.description_courte}
                    </Link>
                  </TableCell>
                  <TableCell>{ACTION_PRIORITE_LABELS[a.priorite]}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${STATUT_CLASS[a.statut] ?? "bg-muted"}`}
                    >
                      {ACTION_STATUT_LABELS[a.statut]}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(a.date_prevue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
