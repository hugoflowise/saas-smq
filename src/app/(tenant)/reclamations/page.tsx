import { headers } from "next/headers";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ShareFormCard } from "@/components/share-form-card";
import { StatTiles } from "@/components/stat-tiles";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOMAINE_SSE_LABELS, type DomaineSse } from "@/lib/domaines-sse";
import { formatDate } from "@/lib/format";
import { REMONTEE_TYPE_LABELS } from "@/lib/labels";
import { getNormesActives } from "@/lib/normes-actives";
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
  const normes = await getNormesActives();
  const afficherSse = normes.includes("MASE");
  const [{ data: reclamations }, { data: processus }] = await Promise.all([
    supabase
      .from("reclamations")
      .select(
        "id, type, objet, client, declarant_email, declarant_role, date_reception, canal, gravite, description, traitement, statut, domaine, analyse_methode, analyse_causes, avec_arret, jours_arret",
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
        concept="remontees"
        help="Tracez toutes les remontées (réclamation client, dysfonctionnement, incident, accident), analysez les causes et déclenchez des actions dans le plan d'actions. Cochez « Créer une action liée » à l'enregistrement pour ouvrir automatiquement l'action de traitement."
      >
        <ReclamationDialog processusOptions={processusOptions} afficherSse={afficherSse} />
      </PageHeader>

      {afficherSse ? (
        <StatTiles
          className="mb-6"
          tiles={[
            {
              label: "Situations dangereuses",
              value: items.filter((r) => r.type === "situation_dangereuse").length,
              cls: "text-status-pa",
            },
            {
              label: "Presqu'accidents",
              value: items.filter((r) => r.type === "presqu_accident").length,
              cls: "text-status-pa",
            },
            {
              label: "Accidents",
              value: items.filter((r) => r.type === "accident").length,
              cls: "text-status-nc-majeure",
            },
            {
              label: "Impacts environnementaux",
              value: items.filter((r) => r.type === "impact_environnemental").length,
              cls: "text-foreground",
            },
          ]}
        />
      ) : null}

      <ShareFormCard
        lien={lien}
        copyLabel="Lien à partager aux BM et consultants"
        emailSubject="Remonter une réclamation, un dysfonctionnement ou un incident"
        emailIntro={
          "Bonjour,\n\n" +
          "Pour remonter une réclamation client, un dysfonctionnement, un incident ou un accident, " +
          "ouvrez ce lien (aucune connexion requise) et remplissez le formulaire. " +
          "Pensez à l'ajouter à l'écran d'accueil de votre téléphone pour l'avoir toujours sous la main :"
        }
        hint="Aucune connexion requise : le BM ou le consultant ouvre le lien (ou scanne le QR) et remonte une réclamation, un dysfonctionnement, un incident ou un accident. La remontée arrive ici au statut « reçue »."
      />

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
                {afficherSse ? <TableHead>Domaine</TableHead> : null}
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
                    <Link href={`/reclamations/${r.id}`} className={ROW_NAME_BUTTON}>
                      {r.objet}
                    </Link>
                  </TableCell>
                  {afficherSse ? (
                    <TableCell className="text-muted-foreground text-sm">
                      {r.domaine ? DOMAINE_SSE_LABELS[r.domaine as DomaineSse] : "-"}
                    </TableCell>
                  ) : null}
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
