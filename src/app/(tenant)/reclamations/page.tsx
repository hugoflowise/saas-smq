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
import { ReclamationDialog } from "./reclamation-dialog";

const CANAL_LABELS: Record<string, string> = {
  mail: "E-mail",
  tel: "Téléphone",
  visio: "Visio",
  audit: "Audit",
  enquete: "Enquête",
  autre: "Autre",
};
const STATUT_LABELS: Record<string, string> = {
  recue: "Reçue",
  analysee: "Analysée",
  traitee: "Traitée",
  cloturee: "Clôturée",
};
const GRAVITE_LABELS: Record<string, string> = {
  mineure: "Mineure",
  majeure: "Majeure",
  critique: "Critique",
};

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function ReclamationsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Réclamations" description="Plaintes et réclamations clients." />
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
    .select("id, objet, client, date_reception, canal, gravite, description, traitement, statut")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_reception", { ascending: false });

  const items = reclamations ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Réclamations" description="Plaintes et réclamations clients.">
        <ReclamationDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune réclamation"
          description="Enregistrez une réclamation client pour la suivre jusqu'à sa clôture."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objet</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Reçue le</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.objet}</TableCell>
                  <TableCell>{r.client ?? "—"}</TableCell>
                  <TableCell>{CANAL_LABELS[r.canal] ?? r.canal}</TableCell>
                  <TableCell>{GRAVITE_LABELS[r.gravite] ?? r.gravite}</TableCell>
                  <TableCell>{STATUT_LABELS[r.statut] ?? r.statut}</TableCell>
                  <TableCell>{formatDate(r.date_reception)}</TableCell>
                  <TableCell>
                    <ReclamationDialog reclamation={r} />
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
