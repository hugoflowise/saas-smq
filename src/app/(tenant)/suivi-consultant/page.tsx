import { SlidersHorizontal } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ShareFormCard } from "@/components/share-form-card";
import { StatTiles } from "@/components/stat-tiles";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate } from "@/lib/format";
import { resoudreDefinitionFormulaire } from "@/lib/formulaire-modeles";
import { computeNps, npsLabel } from "@/lib/nps";
import { QSSE_CONFORMITE_KEYS } from "@/lib/suivi-consultant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ExportButton } from "./export-button";
import { OfflineFormButton } from "./offline-form-button";

function moyenne(arr: number[]): number | null {
  return arr.length > 0
    ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
    : null;
}

export default async function SuiviConsultantPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Suivi consultant"
          description="Points de suivi terrain des consultants."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: suivis } = await supabase
    .from("suivis_consultant")
    .select(
      "id, nom, client, poste, site_intervention, satisfaction_globale, note_qualite_suivi_manager, nps, coherence_odm, secteur_nucleaire, besoin_accompagnement, habilitations, alerte, created_at, reponses",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("created_at", { ascending: false });
  const items = suivis ?? [];

  const { sections } = await resoudreDefinitionFormulaire(
    supabase,
    ctx.effectiveTenantId,
    "suivi_consultant",
  );
  const champsExport = sections.flatMap((s) => s.champs);

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("survey_token")
    .eq("id", ctx.effectiveTenantId)
    .maybeSingle();
  const h = await headers();
  const host = h.get("host") ?? "app.flowise.fr";
  const proto = host.includes("localhost") ? "http" : "https";
  const lien = `${proto}://${host}/enquete/${tenant?.survey_token ?? ""}/suivi-consultant`;

  // KPIs
  const satMoyenne = moyenne(
    items.map((s) => s.satisfaction_globale).filter((n): n is number => n != null),
  );
  const managerMoyenne = moyenne(
    items.map((s) => s.note_qualite_suivi_manager).filter((n): n is number => n != null),
  );
  const { nps } = computeNps(items.map((s) => s.nps));
  const alertes = items.filter((s) => s.alerte).length;
  const nucleaire = items.filter((s) => s.secteur_nucleaire).length;
  const accompagnement = items.filter((s) => s.besoin_accompagnement).length;

  const odmAnswered = items.filter((s) => s.coherence_odm != null);
  const coherenceOdm =
    odmAnswered.length > 0
      ? Math.round((odmAnswered.filter((s) => s.coherence_odm).length / odmAnswered.length) * 100)
      : null;

  let qsseOui = 0;
  let qsseTotal = 0;
  for (const s of items) {
    const r = (s.reponses ?? {}) as Record<string, unknown>;
    for (const k of QSSE_CONFORMITE_KEYS) {
      if (r[k] === "Oui") {
        qsseOui++;
        qsseTotal++;
      } else if (r[k] === "Non") {
        qsseTotal++;
      }
    }
  }
  const conformiteQsse = qsseTotal > 0 ? Math.round((qsseOui / qsseTotal) * 100) : null;

  const tiles = [
    { label: "Suivis réalisés", value: items.length, cls: "text-foreground" },
    { label: "Satisfaction exp. /5", value: satMoyenne ?? "-", cls: "text-status-conforme" },
    { label: "Suivi manager /5", value: managerMoyenne ?? "-", cls: "text-status-conforme" },
    { label: `eNPS (${npsLabel(nps)})`, value: nps ?? "-", cls: "text-status-pf" },
    {
      label: "Conformité QSSE",
      value: conformiteQsse != null ? `${conformiteQsse}%` : "-",
      cls: "text-status-pa",
    },
    {
      label: "Cohérence ODM",
      value: coherenceOdm != null ? `${coherenceOdm}%` : "-",
      cls: "text-status-pa",
    },
    { label: "Alertes santé/RPS", value: alertes, cls: "text-status-nc-majeure" },
    { label: "Besoin accompagnement", value: accompagnement, cls: "text-status-pa" },
    { label: "En nucléaire", value: nucleaire, cls: "text-foreground" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Suivi consultant"
        description="Points de suivi terrain remplis par les consultants (QSSE, ODM, bien-être, satisfaction)."
        isoClause="ISO 9001 §7.1 / §9.1"
        help="Lien à partager aux consultants (mail, QR code) : ils remplissent leur point de suivi sans connexion. Les réponses alimentent les KPIs QSSE (droit de retrait, plan de prévention, point de rassemblement, EPI), la cohérence à l'Ordre De Mission, la satisfaction et l'eNPS, et signalent les alertes santé/RPS. eNPS = % promoteurs (9-10) − % détracteurs (0-6)."
      >
        {ctx.role !== "auditeur" ? (
          <Link
            href="/suivi-consultant/formulaire"
            className={buttonVariants({ variant: "outline" })}
          >
            <SlidersHorizontal className="size-4" />
            Personnaliser le formulaire
          </Link>
        ) : null}
        {ctx.role !== "auditeur" ? <OfflineFormButton type="suivi_consultant" /> : null}
        <ExportButton
          champs={champsExport}
          rows={items.map((s) => ({
            alerte: s.alerte,
            reponses: (s.reponses ?? null) as Record<string, unknown> | null,
          }))}
        />
      </PageHeader>

      <ShareFormCard
        lien={lien}
        copyLabel="Lien à partager aux consultants"
        emailSubject="Point de suivi consultant"
        emailIntro={
          "Bonjour,\n\n" +
          "Pour remplir votre point de suivi, ouvrez ce lien (aucune connexion requise) " +
          "depuis votre téléphone. " +
          "Pensez à l'ajouter à l'écran d'accueil pour l'avoir toujours sous la main :"
        }
        hint="Aucune connexion requise : le consultant ouvre le lien (ou scanne le QR) sur son téléphone et remplit son point de suivi."
      />

      {items.length > 0 ? <StatTiles tiles={tiles} className="mb-6" /> : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aucun suivi"
          description="Partagez le lien aux consultants : leurs points de suivi apparaîtront ici."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Consultant</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Satisf. /5</TableHead>
                <TableHead>eNPS</TableHead>
                <TableHead>Alerte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id} className="cursor-pointer">
                  <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                    <Link href={`/suivi-consultant/${s.id}`} className="block">
                      {formatDate(s.created_at.slice(0, 10))}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/suivi-consultant/${s.id}`} className="block hover:text-primary">
                      {s.nom ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.client ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.poste ?? "-"}</TableCell>
                  <TableCell>{s.satisfaction_globale ?? "-"}</TableCell>
                  <TableCell>{s.nps ?? "-"}</TableCell>
                  <TableCell>
                    {s.alerte ? (
                      <span
                        className={`${BADGE_BASE} bg-status-nc-majeure/15 text-status-nc-majeure`}
                      >
                        Alerte
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
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
