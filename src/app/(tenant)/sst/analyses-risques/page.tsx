import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import { SupprimerButton } from "@/components/supprimer-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteAdrAction } from "@/lib/actions/analyses-risques";
import { ADR_STATUT_CLASS, ADR_STATUT_LABELS, type AdrStatut } from "@/lib/adr";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { AdrDialog } from "./adr-dialog";

export default async function AnalysesRisquesPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Analyses de risques"
          description="Une analyse de risques par mission, avec plan de prévention."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer ses analyses de risques."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: analyses } = await supabase
    .from("analyses_risques")
    .select(
      "id, intitule, mission, lieu, date_analyse, date_revision, statut, pdp_reference, pdp_lien",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .is("deleted_at", null)
    .order("date_analyse", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const items = analyses ?? [];
  const today = todayISO();

  const validees = items.filter((a) => a.statut === "validee").length;
  const aReviser = items.filter(
    (a) => a.statut === "a_reviser" || (a.date_revision != null && a.date_revision <= today),
  ).length;
  // PDP obligatoire (MASE) : « fourni » si une référence ou un lien est renseigné.
  const pdpFourni = (a: { pdp_reference: string | null; pdp_lien: string | null }) =>
    Boolean(a.pdp_reference || a.pdp_lien);
  const pdpAFournir = items.filter((a) => !pdpFourni(a)).length;

  const tiles = [
    { label: "Analyses", value: items.length, cls: "text-foreground" },
    { label: "Validées", value: validees, cls: "text-status-conforme" },
    { label: "À réviser", value: aReviser, cls: "text-status-pa" },
    {
      label: "PDP à fournir",
      value: pdpAFournir,
      cls: pdpAFournir > 0 ? "text-status-nc-majeure" : "text-status-conforme",
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Analyses de risques"
        description="Une analyse de risques par mission, avec plan de prévention."
        isoClause="MASE Axe 3"
        help="Pour chaque mission, formalisez l'analyse des risques (situations de travail, dangers par domaine Sécurité / Santé / Environnement, cotation et mesures de prévention). Le plan de prévention co-signé avec le client est une donnée d'entrée de l'analyse."
      >
        <AdrDialog />
      </PageHeader>

      <StatTiles tiles={tiles} className="mb-6" />

      {items.length === 0 ? (
        <EmptyState
          title="Aucune analyse de risques"
          description="Créez une analyse de risques pour votre première mission."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[34%]">Intitulé</TableHead>
                <TableHead>Mission / site</TableHead>
                <TableHead>Analyse</TableHead>
                <TableHead>Révision</TableHead>
                <TableHead>PDP</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => {
                const enRetard =
                  a.statut !== "archivee" && a.date_revision != null && a.date_revision <= today;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-normal font-medium">
                      <Link
                        href={`/sst/analyses-risques/${a.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {a.intitule}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {[a.mission, a.lieu].filter(Boolean).join(" · ") || "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {a.date_analyse ? formatDate(a.date_analyse) : "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {a.date_revision ? (
                        enRetard ? (
                          <span className={`${BADGE_BASE} bg-status-pa/15 text-status-pa`}>
                            {formatDate(a.date_revision)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {formatDate(a.date_revision)}
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {pdpFourni(a) ? (
                        <span
                          className={`${BADGE_BASE} bg-status-conforme/15 text-status-conforme`}
                        >
                          Fourni
                        </span>
                      ) : (
                        <span
                          className={`${BADGE_BASE} bg-status-nc-majeure/15 text-status-nc-majeure`}
                        >
                          À fournir
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`${BADGE_BASE} ${ADR_STATUT_CLASS[a.statut as AdrStatut]}`}>
                        {ADR_STATUT_LABELS[a.statut as AdrStatut]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <SupprimerButton
                        action={deleteAdrAction}
                        id={a.id}
                        libelle="cette analyse de risques"
                        iconOnly
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
