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
import { ACTION_PRIORITE_LABELS, ACTION_STATUT_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ActionDialog } from "./action-dialog";
import { FilterBar } from "./filter-bar";

const STATUT_CLASS: Record<string, string> = {
  a_faire: "bg-muted text-foreground",
  en_cours: "bg-status-pf/15 text-status-pf",
  termine: "bg-status-conforme/15 text-status-conforme",
  bloquee: "bg-status-nc-mineure/15 text-status-nc-mineure",
  abandonnee: "bg-muted text-muted-foreground",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; priorite?: string; echeance?: string }>;
}) {
  const ctx = await getTenantContext();
  const { statut, priorite, echeance } = await searchParams;

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

  const today = new Date().toISOString().slice(0, 10);
  if (echeance === "retard") {
    query = query.lt("date_prevue", today).in("statut", ["a_faire", "en_cours", "bloquee"]);
  } else if (echeance === "a_venir") {
    query = query.gte("date_prevue", today);
  } else if (echeance === "sans") {
    query = query.is("date_prevue", null);
  }

  const { data: actions } = await query
    .order("priorite", { ascending: true })
    .order("date_prevue", { ascending: true, nullsFirst: false });

  const items = actions ?? [];
  const options = processusOptions ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Plan d'actions"
        description="Suivi des actions d'amélioration, correctives et préventives."
      >
        <ActionDialog processusOptions={options} />
      </PageHeader>

      <FilterBar />

      {items.length === 0 ? (
        <EmptyState title="Aucune action" description="Créez une action ou ajustez les filtres." />
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
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {a.reference}
                  </TableCell>
                  <TableCell className="font-medium">{a.description_courte}</TableCell>
                  <TableCell>{ACTION_PRIORITE_LABELS[a.priorite]}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${STATUT_CLASS[a.statut] ?? "bg-muted"}`}
                    >
                      {ACTION_STATUT_LABELS[a.statut]}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(a.date_prevue)}</TableCell>
                  <TableCell>
                    <ActionDialog processusOptions={options} action={a} />
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
