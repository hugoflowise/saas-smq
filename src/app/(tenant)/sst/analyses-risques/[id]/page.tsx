import { AlertTriangle } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SupprimerButton } from "@/components/supprimer-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteAdrAction } from "@/lib/actions/analyses-risques";
import { ADR_STATUT_CLASS, ADR_STATUT_LABELS, type AdrStatut, criticiteClass } from "@/lib/adr";
import { BADGE_BASE } from "@/lib/badges";
import { DOMAINE_SSE_LABELS, type DomaineSse } from "@/lib/domaines-sse";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { AdrDialog } from "../adr-dialog";
import { LigneDeleteButton } from "../ligne-delete-button";
import { LigneDialog } from "../ligne-dialog";

export default async function AnalyseRisquesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/sst/analyses-risques");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: analyse } = await supabase
    .from("analyses_risques")
    .select(
      "id, intitule, mission, lieu, date_analyse, date_revision, statut, pdp_reference, pdp_lien, pdp_date_signature, notes",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .maybeSingle();

  if (!analyse) notFound();

  const { data: lignes } = await supabase
    .from("analyses_risques_lignes")
    .select(
      "id, tache, domaine, danger, gravite, probabilite, criticite, mesures_prevention, risque_residuel",
    )
    .eq("analyse_id", id)
    .eq("tenant_id", tid)
    .order("ordre", { ascending: true });

  const rows = lignes ?? [];
  const domainesCouverts = new Set(rows.map((l) => l.domaine));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <BackLink href="/sst/analyses-risques" label="Analyses de risques" />

      <PageHeader
        title={analyse.intitule}
        description={[analyse.mission, analyse.lieu].filter(Boolean).join(" · ") || undefined}
      >
        <span className={`${BADGE_BASE} ${ADR_STATUT_CLASS[analyse.statut as AdrStatut]}`}>
          {ADR_STATUT_LABELS[analyse.statut as AdrStatut]}
        </span>
        <AdrDialog analyse={analyse} />
        <SupprimerButton
          action={deleteAdrAction}
          id={analyse.id}
          libelle="cette analyse de risques"
          redirectTo="/sst/analyses-risques"
        />
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Info
              label="Date d'analyse"
              value={analyse.date_analyse ? formatDate(analyse.date_analyse) : "-"}
            />
            <Info
              label="Prochaine révision"
              value={analyse.date_revision ? formatDate(analyse.date_revision) : "-"}
            />
            <div className="col-span-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Notes / méthode
              </p>
              <p className="mt-1 whitespace-pre-wrap">{analyse.notes?.trim() || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan de prévention</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {analyse.pdp_reference || analyse.pdp_lien ? (
              <div className="grid grid-cols-2 gap-4">
                <Info label="Référence" value={analyse.pdp_reference?.trim() || "-"} />
                <Info
                  label="Signé le"
                  value={analyse.pdp_date_signature ? formatDate(analyse.pdp_date_signature) : "-"}
                />
                <div className="col-span-2">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Document
                  </p>
                  {analyse.pdp_lien ? (
                    <a
                      href={analyse.pdp_lien}
                      target="_blank"
                      rel="noopener"
                      className="mt-1 inline-block text-primary text-sm hover:underline"
                    >
                      Ouvrir le plan de prévention
                    </a>
                  ) : (
                    <p className="mt-1">-</p>
                  )}
                </div>
                <p className="col-span-2 text-muted-foreground text-xs">
                  Le plan de prévention co-signé avec l'entreprise utilisatrice est une donnée
                  d'entrée de cette analyse : il ne la remplace pas.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-status-nc-majeure/40 bg-status-nc-majeure/5 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-nc-majeure" />
                <p className="text-status-nc-majeure text-sm">
                  Plan de prévention à fournir : toute intervention MASE doit être couverte par un
                  PDP co-signé. Renseignez sa référence ou son lien via « Modifier ».
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base">Situations de travail & cotation</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {(["securite", "sante", "environnement"] as const).map((d) => {
                const couvert = domainesCouverts.has(d);
                return (
                  <span
                    key={d}
                    className={`${BADGE_BASE} ${
                      couvert
                        ? "bg-status-conforme/15 text-status-conforme"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {DOMAINE_SSE_LABELS[d]}
                  </span>
                );
              })}
            </div>
          </div>
          <LigneDialog analyseId={analyse.id} />
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              title="Aucune situation de travail"
              description="Ajoutez les phases / situations de travail de la mission et leurs risques."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%]">Tâche / situation</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead className="w-[22%]">Danger / risque</TableHead>
                  <TableHead>G × P</TableHead>
                  <TableHead>Criticité</TableHead>
                  <TableHead className="w-[26%]">Mesures de prévention</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-normal font-medium">{l.tache}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {DOMAINE_SSE_LABELS[l.domaine as DomaineSse]}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground text-sm">
                      {l.danger?.trim() || "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {l.gravite} × {l.probabilite}
                    </TableCell>
                    <TableCell>
                      <span className={`${BADGE_BASE} ${criticiteClass(l.criticite ?? 0)}`}>
                        {l.criticite}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground text-sm">
                      {l.mesures_prevention?.trim() || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <LigneDialog analyseId={analyse.id} ligne={l} />
                        <LigneDeleteButton id={l.id} analyseId={analyse.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
