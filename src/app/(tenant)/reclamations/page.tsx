import { ExternalLink } from "lucide-react";
import { headers } from "next/headers";
import { CopyField } from "@/components/copy-field";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QrCode } from "@/components/qr-code";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createAdminClient } from "@/lib/supabase/admin";
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

const ROLE_LABELS: Record<string, string> = {
  business_manager: "Business manager",
  consultant: "Consultant",
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
  const [{ data: reclamations }, { data: processus }] = await Promise.all([
    supabase
      .from("reclamations")
      .select(
        "id, type, objet, client, declarant_email, declarant_role, date_reception, canal, gravite, description, traitement, statut",
      )
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("date_reception", { ascending: false }),
    supabase
      .from("processus")
      .select("id, nom")
      .eq("tenant_id", ctx.effectiveTenantId)
      .is("deleted_at", null)
      .order("nom"),
  ]);

  const items = reclamations ?? [];
  const processusOptions = processus ?? [];

  // Lien public de signalement (même mécanique que les formulaires de suivi) :
  // porté par le survey_token, à diffuser aux BM et consultants sans compte.
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("survey_token")
    .eq("id", ctx.effectiveTenantId)
    .maybeSingle();
  const h = await headers();
  const host = h.get("host") ?? "app.flowise.fr";
  const proto = host.includes("localhost") ? "http" : "https";
  const lien = `${proto}://${host}/enquete/${tenant?.survey_token ?? ""}/signalement`;

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Partager le formulaire</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <QrCode value={lien} />
          <div className="min-w-0 flex-1">
            <CopyField label="Lien à partager aux BM et consultants" value={lien} />
            <a
              href={lien}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-medium text-sm transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-4" />
              Ouvrir le formulaire
            </a>
            <p className="mt-2 text-muted-foreground text-xs">
              Aucune connexion requise : le BM ou le consultant ouvre le lien (ou scanne le QR) et
              remonte une réclamation, un dysfonctionnement, un incident ou un accident. La remontée
              arrive ici au statut « reçue ».
            </p>
          </div>
        </CardContent>
      </Card>

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
                    {r.declarant_role ? (
                      <span className="block text-muted-foreground text-xs">
                        {ROLE_LABELS[r.declarant_role] ?? r.declarant_role}
                      </span>
                    ) : null}
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
