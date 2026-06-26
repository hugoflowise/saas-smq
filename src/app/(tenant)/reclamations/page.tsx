import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { REMONTEE_TYPE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { RecGraviteCell, RecStatutCell } from "./inline-cells";
import { ReclamationDialog } from "./reclamation-dialog";

const CANAL_LABELS: Record<string, string> = {
  mail: "E-mail",
  tel: "Téléphone",
  visio: "Visio",
  audit: "Audit",
  enquete: "Enquête",
  autre: "Autre",
};

export default async function ReclamationsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Remontées"
          description="Réclamations, dysfonctionnements, incidents et accidents."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: reclamations } = await supabase
    .from("reclamations")
    .select(
      "id, type, objet, client, date_reception, canal, gravite, description, traitement, statut",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_reception", { ascending: false });

  const items = reclamations ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Remontées"
        description="Réclamations, dysfonctionnements, incidents et accidents."
        isoClause="ISO 9001 §9.1.2 · §10.2"
        help="Tracez toutes les remontées (réclamation client, dysfonctionnement, incident, accident), analysez les causes et déclenchez des actions dans le plan d'actions. Cochez « Créer une action liée » à l'enregistrement pour ouvrir automatiquement l'action de traitement."
      >
        <ReclamationDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune remontée"
          description="Enregistrez une remontée (réclamation, dysfonctionnement, incident, accident) pour la suivre jusqu'à sa clôture."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Type</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Reçue le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {REMONTEE_TYPE_LABELS[r.type] ?? r.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ReclamationDialog
                      reclamation={r}
                      trigger={
                        <button type="button" className={ROW_NAME_BUTTON}>
                          {r.objet}
                        </button>
                      }
                    />
                  </TableCell>
                  <TableCell>{r.client ?? "-"}</TableCell>
                  <TableCell>{CANAL_LABELS[r.canal] ?? r.canal}</TableCell>
                  <TableCell>
                    <RecGraviteCell id={r.id} value={r.gravite} />
                  </TableCell>
                  <TableCell>
                    <RecStatutCell id={r.id} value={r.statut} />
                  </TableCell>
                  <TableCell>{formatDate(r.date_reception)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
