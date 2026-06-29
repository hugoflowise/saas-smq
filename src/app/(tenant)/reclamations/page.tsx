import { headers } from "next/headers";
import { CopyField } from "@/components/copy-field";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QrCode } from "@/components/qr-code";
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
  const [{ data: reclamations }, { data: processus }, { data: tenant }] = await Promise.all([
    supabase
      .from("reclamations")
      .select(
        "id, type, objet, client, declarant_email, date_reception, canal, gravite, description, traitement, statut",
      )
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("date_reception", { ascending: false }),
    supabase
      .from("processus")
      .select("id, nom")
      .eq("tenant_id", ctx.effectiveTenantId)
      .is("deleted_at", null)
      .order("nom"),
    supabase.from("tenants").select("survey_token").eq("id", ctx.effectiveTenantId).maybeSingle(),
  ]);

  const items = reclamations ?? [];
  const processusOptions = processus ?? [];

  // Lien public de signalement : à partager (e-mail de fin de mission, site, QR
  // sur site/affichage) pour que clients et intervenants sans compte remontent
  // réclamations, dysfonctionnements, incidents et accidents.
  const h = await headers();
  const host = h.get("host") ?? "app.flowise.fr";
  const proto = host.includes("localhost") ? "http" : "https";
  const signalementUrl = `${proto}://${host}/signalement/${tenant?.survey_token ?? ""}`;

  return (
    <div className="w-full">
      <PageHeader
        title="Remontées"
        description="Réclamations, dysfonctionnements, incidents et accidents."
        isoClause="ISO 9001 §9.1.2 · §10.2"
        help="Tracez toutes les remontées (réclamation client, dysfonctionnement, incident, accident), analysez les causes et déclenchez des actions dans le plan d'actions. Cochez « Créer une action liée » à l'enregistrement pour ouvrir automatiquement l'action de traitement."
      >
        <ReclamationDialog processusOptions={processusOptions} />
      </PageHeader>

      <details className="group mb-6 rounded-2xl border bg-card text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium hover:text-primary">
          Formulaire public de signalement (lien / QR)
          <span className="ml-auto text-muted-foreground text-xs group-open:hidden">Afficher</span>
          <span className="ml-auto hidden text-muted-foreground text-xs group-open:inline">
            Masquer
          </span>
        </summary>
        <div className="flex flex-col gap-4 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              Partagez ce lien (ou le QR) à vos clients et intervenants sans compte : leurs
              signalements arrivent directement ici, au statut « reçue ».
            </p>
            <CopyField label="Lien public de signalement" value={signalementUrl} />
          </div>
          <div className="shrink-0 rounded-xl border bg-surface p-3">
            <QrCode value={signalementUrl} size={132} />
          </div>
        </div>
      </details>

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
                  <TableCell>
                    {r.client ?? "-"}
                    {r.declarant_email ? (
                      <a
                        href={`mailto:${r.declarant_email}`}
                        className="block text-primary text-xs hover:underline"
                      >
                        {r.declarant_email}
                      </a>
                    ) : null}
                  </TableCell>
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
