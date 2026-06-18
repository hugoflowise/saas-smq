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
import { ObjectifDialog } from "./objectif-dialog";

const STATUT_LABELS: Record<string, string> = {
  actif: "Actif",
  atteint: "Atteint",
  abandonne: "Abandonné",
};

export default async function ObjectifsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Objectifs qualité"
          description="Objectifs SMART et leur déclinaison par fonction."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: objectifs } = await supabase
    .from("objectifs_qualite")
    .select("id, intitule, description, cible_chiffree, echeance, fonction_concernee, statut")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("created_at", { ascending: true });

  const items = objectifs ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Objectifs qualité"
        description="Objectifs SMART et leur déclinaison par fonction."
      >
        <ObjectifDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun objectif"
          description="Définissez les objectifs qualité (SMART) alignés sur la politique."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objectif</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.intitule}</TableCell>
                  <TableCell>{o.cible_chiffree ?? "—"}</TableCell>
                  <TableCell>{o.fonction_concernee ?? "—"}</TableCell>
                  <TableCell>{formatDate(o.echeance)}</TableCell>
                  <TableCell>{STATUT_LABELS[o.statut] ?? o.statut}</TableCell>
                  <TableCell>
                    <ObjectifDialog objectif={o} />
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
