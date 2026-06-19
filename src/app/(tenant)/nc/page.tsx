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
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { NcGraviteCell, NcStatutCell } from "./inline-cells";
import { NcDialog } from "./nc-dialog";
import { NcFilterBar } from "./nc-filter-bar";
import { NcKanban } from "./nc-kanban";
import { NcViewToggle } from "./nc-view-toggle";

export default async function NcPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; gravite?: string; vue?: string }>;
}) {
  const ctx = await getTenantContext();
  const { statut, gravite, vue } = await searchParams;

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Non-conformités"
          description="Détection, analyse des causes et traitement des non-conformités."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour afficher ses non-conformités."
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
    .from("non_conformites")
    .select(
      "id, reference, intitule, description, date_constat, origine, gravite, type, statut, processus_concerne",
    )
    .eq("tenant_id", ctx.effectiveTenantId);

  if (statut)
    query = query.eq(
      "statut",
      statut as "ouverte" | "analysee" | "action_definie" | "cloturee" | "efficace" | "inefficace",
    );
  if (gravite) query = query.eq("gravite", gravite as "mineure" | "majeure" | "critique");

  const { data: ncs } = await query.order("date_constat", { ascending: false });

  const items = ncs ?? [];
  const options = processusOptions ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Non-conformités"
        description="Détection, analyse des causes et traitement des non-conformités."
        isoClause="ISO 9001 §10.2"
        help="Face à une non-conformité : réagir, analyser les causes profondes (5 Pourquoi, Ishikawa…), mettre en place une action corrective puis vérifier son efficacité. Une NC peut découler de vos propres exigences internes."
      >
        <NcViewToggle />
        <NcDialog processusOptions={options} />
      </PageHeader>

      <NcFilterBar />

      {items.length === 0 ? (
        <EmptyState
          title="Aucune non-conformité"
          description="Enregistrez une non-conformité pour démarrer son traitement."
        />
      ) : vue === "kanban" ? (
        <NcKanban
          key={`${statut ?? ""}|${gravite ?? ""}`}
          initial={items.map((nc) => ({
            id: nc.id,
            reference: nc.reference,
            intitule: nc.intitule,
            gravite: nc.gravite,
            statut: nc.statut,
          }))}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf.</TableHead>
                <TableHead>Intitulé</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Constat</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((nc) => (
                <TableRow key={nc.id}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {nc.reference}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/nc/${nc.id}`} className="hover:text-primary hover:underline">
                      {nc.intitule}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <NcGraviteCell id={nc.id} value={nc.gravite} />
                  </TableCell>
                  <TableCell>
                    <NcStatutCell id={nc.id} value={nc.statut} />
                  </TableCell>
                  <TableCell>{formatDate(nc.date_constat)}</TableCell>
                  <TableCell>
                    <NcDialog processusOptions={options} nc={nc} />
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
