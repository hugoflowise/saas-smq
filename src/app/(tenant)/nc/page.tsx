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
import { NC_GRAVITE_LABELS, NC_STATUT_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { NcDialog } from "./nc-dialog";
import { NcFilterBar } from "./nc-filter-bar";
import { NcKanban } from "./nc-kanban";
import { NcViewToggle } from "./nc-view-toggle";

const GRAVITE_CLASS: Record<string, string> = {
  mineure: "bg-status-pa/15 text-status-pa",
  majeure: "bg-status-nc-mineure/15 text-status-nc-mineure",
  critique: "bg-status-nc-majeure/15 text-status-nc-majeure",
};

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function NcPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; gravite?: string; vue?: string }>;
}) {
  const ctx = await getTenantContext();
  const { statut, gravite, vue } = await searchParams;

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
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
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Non-conformités"
        description="Détection, analyse des causes et traitement des non-conformités."
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
                  <TableCell className="font-medium">{nc.intitule}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${GRAVITE_CLASS[nc.gravite] ?? "bg-muted"}`}
                    >
                      {NC_GRAVITE_LABELS[nc.gravite]}
                    </span>
                  </TableCell>
                  <TableCell>{NC_STATUT_LABELS[nc.statut]}</TableCell>
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
