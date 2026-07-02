import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProposeBadge } from "@/components/propose-badge";
import { ProposeBanner, RefuserButton, ValiderButton } from "@/components/propose-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ViewToggle } from "@/components/view-toggle";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { listTenantMembers } from "@/lib/tenant-users";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { ActionDialog } from "./action-dialog";
import { FilterBar } from "./filter-bar";
import { CategorieCell, EcheanceCell, PrioriteCell, StatutCell } from "./inline-cells";
import { ActionsKanban } from "./kanban";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    statut?: string;
    priorite?: string;
    tri?: string;
    vue?: string;
    filtre?: string;
    ci?: string;
  }>;
}) {
  const ctx = await getTenantContext();
  const { statut, priorite, tri, vue, filtre, ci } = await searchParams;
  const today = todayISO();

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

  const [{ data: processusOptions }, { data: objectifOptions }, membres] = await Promise.all([
    supabase
      .from("processus")
      .select("id, nom")
      .eq("tenant_id", ctx.effectiveTenantId)
      .is("deleted_at", null)
      .order("ordre_affichage", { ascending: true }),
    supabase
      .from("objectifs_qualite")
      .select("id, intitule")
      .eq("tenant_id", ctx.effectiveTenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    listTenantMembers(ctx.effectiveTenantId),
  ]);
  const membreNom = new Map(membres.map((m) => [m.id, m.nom]));

  let query = supabase
    .from("actions")
    .select(
      "id, reference, description_courte, description_detail, origine, type, priorite, statut, processus_concerne, responsable_id, date_prevue, date_effective, indicateur_efficacite, resultat_efficacite, date_verification_efficacite, resultat_verification, commentaires, constat, cause_fondamentale, recommandation, cotation, categorie, propose, valide_le",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .is("deleted_at", null);

  // Filtre sur un point SWOT/PESTEL précis (depuis la pastille du contexte).
  if (ci) query = query.eq("contexte_item_id", ci);

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
    query = query.eq("categorie", "nc_majeure");
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
  const objectifs = objectifOptions ?? [];
  const aValider = items.filter((a) => a.propose && !a.valide_le).length;

  return (
    <div className="w-full">
      <PageHeader
        title="Plan d'actions"
        description="Suivi des actions d'amélioration, correctives et préventives."
        concept="actions"
        help="Colonne vertébrale du {{sigle}} : toutes les actions convergent ici, quelle que soit leur origine (audit, non-conformité, réclamation, revue, risque…). Une seule liste, filtrable par origine."
      >
        <ViewToggle />
        <ActionDialog
          processusOptions={options}
          objectifOptions={objectifs}
          responsableOptions={membres}
        />
      </PageHeader>

      <ProposeBanner table="actions" count={aValider} libelle="actions de démarrage" />

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
        <ActionsKanban key={`${statut ?? ""}|${priorite ?? ""}|${filtre ?? ""}`} initial={items} />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf.</TableHead>
                <TableHead className="w-[22%]">Intitulé</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="w-[16%]">Résultats / Efficacité</TableHead>
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
                  <TableCell className="whitespace-normal font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionDialog
                        processusOptions={options}
                        objectifOptions={objectifs}
                        responsableOptions={membres}
                        action={a}
                        trigger={
                          <button type="button" className={ROW_NAME_BUTTON}>
                            {a.description_courte}
                          </button>
                        }
                      />
                      {a.propose && !a.valide_le ? <ProposeBadge /> : null}
                      {a.propose && !a.valide_le ? (
                        <>
                          <RefuserButton table="actions" id={a.id} />
                          <ValiderButton table="actions" id={a.id} />
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategorieCell id={a.id} value={a.categorie} />
                  </TableCell>
                  <TableCell>
                    <PrioriteCell id={a.id} value={a.priorite} />
                  </TableCell>
                  <TableCell>
                    <StatutCell id={a.id} value={a.statut} />
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm">
                    {a.responsable_id ? (membreNom.get(a.responsable_id) ?? "-") : "-"}
                  </TableCell>
                  <TableCell>
                    <EcheanceCell id={a.id} value={a.date_prevue} />
                  </TableCell>
                  <TableCell className="max-w-[16rem] whitespace-normal text-muted-foreground text-sm">
                    {a.resultat_efficacite || "-"}
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
