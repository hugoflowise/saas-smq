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
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ActionDialog } from "./action-dialog";
import { FilterBar } from "./filter-bar";
import { CotationCell, EcheanceCell, PrioriteCell, StatutCell } from "./inline-cells";
import { ActionsKanban } from "./kanban";
import { ViewToggle } from "./view-toggle";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    statut?: string;
    priorite?: string;
    tri?: string;
    vue?: string;
    filtre?: string;
  }>;
}) {
  const ctx = await getTenantContext();
  const { statut, priorite, tri, vue, filtre } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

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
      "id, reference, description_courte, description_detail, origine, type, priorite, statut, processus_concerne, date_prevue, indicateur_efficacite, commentaires, cotation",
    )
    .eq("tenant_id", ctx.effectiveTenantId);

  if (statut)
    query = query.eq(
      "statut",
      statut as "a_faire" | "en_cours" | "termine" | "bloquee" | "abandonnee",
    );
  if (priorite) query = query.eq("priorite", priorite as "p1" | "p2" | "p3");

  // Filtres pré-construits (vues rapides)
  if (filtre === "retard") {
    query = query
      .in("statut", ["a_faire", "en_cours", "bloquee"] as ("a_faire" | "en_cours" | "bloquee")[])
      .lt("date_prevue", today);
  } else if (filtre === "nc_majeure") {
    query = query.eq("cotation", "nc_majeure");
  } else if (filtre === "p1") {
    query = query.eq("priorite", "p1");
  } else if (filtre === "solde") {
    query = query.eq("statut", "termine");
  }

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
    <div className="w-full">
      <PageHeader
        title="Plan d'actions"
        description="Suivi des actions d'amélioration, correctives et préventives."
        isoClause="ISO 9001 §10"
        help="Colonne vertébrale du SMQ : toutes les actions convergent ici, quelle que soit leur origine (audit, non-conformité, réclamation, revue, risque…). Une seule liste, filtrable par origine."
      >
        <ViewToggle />
        <ActionDialog processusOptions={options} />
      </PageHeader>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { value: "", label: "Toutes" },
          { value: "retard", label: "En retard" },
          { value: "nc_majeure", label: "NC majeures" },
          { value: "p1", label: "Priorité P1" },
          { value: "solde", label: "Soldées" },
        ].map((c) => (
          <Link
            key={c.value || "tous"}
            href={
              c.value
                ? `/actions?filtre=${c.value}${vue === "kanban" ? "&vue=kanban" : ""}`
                : `/actions${vue === "kanban" ? "?vue=kanban" : ""}`
            }
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              (filtre ?? "") === c.value
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

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
                <TableHead>Cotation</TableHead>
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
                  <TableCell>
                    <CotationCell id={a.id} value={a.cotation} />
                  </TableCell>
                  <TableCell>
                    <PrioriteCell id={a.id} value={a.priorite} />
                  </TableCell>
                  <TableCell>
                    <StatutCell id={a.id} value={a.statut} />
                  </TableCell>
                  <TableCell>
                    <EcheanceCell id={a.id} value={a.date_prevue} />
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
