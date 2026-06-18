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
import { PiDialog } from "./pi-dialog";

const TYPE_LABELS: Record<string, string> = {
  client: "Client",
  fournisseur: "Fournisseur",
  collaborateur: "Collaborateur",
  autorite: "Autorité",
  actionnaire: "Actionnaire",
  autre: "Autre",
};
const INFLUENCE_LABELS: Record<string, string> = {
  faible: "Faible",
  moyen: "Moyen",
  fort: "Fort",
};

export default async function PartiesPrenantesPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Parties prenantes"
          description="Registre des parties intéressées et de leurs attentes."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer ses parties prenantes."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: parties } = await supabase
    .from("parties_interessees")
    .select("id, nom, type, attentes, exigences, niveau_influence")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("nom", { ascending: true });

  const items = parties ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Parties prenantes"
        description="Registre des parties intéressées et de leurs attentes."
        isoClause="ISO 9001 §4.2"
        help="Identifiez les parties intéressées pertinentes (clients, salariés, fournisseurs, État, banques, partenaires…) et leurs exigences. Exigence obligatoire : son absence constitue une non-conformité majeure. Soyez exhaustif."
      >
        <PiDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune partie prenante"
          description="Recensez vos parties intéressées (clients, fournisseurs, autorités…)."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partie prenante</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Attentes</TableHead>
                <TableHead>Influence</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nom}</TableCell>
                  <TableCell>{TYPE_LABELS[p.type] ?? p.type}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {p.attentes ?? "—"}
                  </TableCell>
                  <TableCell>
                    {INFLUENCE_LABELS[p.niveau_influence] ?? p.niveau_influence}
                  </TableCell>
                  <TableCell>
                    <PiDialog pi={p} />
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
