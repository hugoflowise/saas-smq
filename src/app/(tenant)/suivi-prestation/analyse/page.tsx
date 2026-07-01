import Link from "next/link";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { EmptyState } from "@/components/empty-state";
import { Jauge } from "@/components/jauge";
import { ModuleTabs } from "@/components/module-tabs";
import { PageHeader } from "@/components/page-header";
import { SatisfactionBars } from "@/components/satisfaction-bars";
import { StatTiles } from "@/components/stat-tiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { SUIVI_PRESTATION_TABS } from "@/lib/module-tabs";
import {
  analyserSuivisPrestation,
  anneesDisponibles,
  type Comptage,
  type SuiviPrestationRow,
} from "@/lib/suivi-prestation-analyse";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";

/** Barre horizontale « part de satisfaits » ou décompte, en CSS pur. */
function BarreRow({
  label,
  pct,
  valeur,
  tone = "conforme",
}: {
  label: string;
  pct: number | null;
  valeur: string;
  tone?: "conforme" | "pa" | "pf";
}) {
  const width = Math.max(0, Math.min(100, pct ?? 0));
  const bg = tone === "pa" ? "bg-status-pa" : tone === "pf" ? "bg-status-pf" : "bg-status-conforme";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span
          className={cn(
            "shrink-0 font-medium tabular-nums",
            pct == null && "text-muted-foreground",
          )}
        >
          {valeur}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", bg)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

/** Petite liste de décomptes (points forts, axes d'amélioration, besoins). */
function ComptageList({ items, total }: { items: Comptage[]; total: number }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucune donnée sur la période.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {items.slice(0, 8).map((c) => (
        <BarreRow
          key={c.label}
          label={c.label}
          pct={total > 0 ? (c.count / total) * 100 : 0}
          valeur={String(c.count)}
          tone="pf"
        />
      ))}
    </div>
  );
}

export default async function AnalyseSuiviPrestationPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string }>;
}) {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Suivi de prestation" description="Analyse de l'écoute client." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("suivis_prestation")
    .select(
      "consultant, client, mission, date_suivi, satisfaction_globale, nps, est_reclamation, reponses",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_suivi", { ascending: false, nullsFirst: false });

  const tous = (data ?? []) as SuiviPrestationRow[];
  const annees = anneesDisponibles(tous);
  const { annee } = await searchParams;
  // Par défaut : l'année la plus récente (usage revue de direction annuelle).
  const anneeActive =
    annee === "toutes"
      ? null
      : annee && annees.includes(Number(annee))
        ? Number(annee)
        : (annees[0] ?? null);

  const rows =
    anneeActive == null
      ? tous
      : tous.filter((r) => Number((r.date_suivi ?? "").slice(0, 4)) === anneeActive);

  const a = analyserSuivisPrestation(rows);
  const periodeLabel = anneeActive == null ? "toutes les années" : String(anneeActive);

  const tiles = [
    { label: "Suivis réalisés", value: a.nbSuivis, cls: "text-foreground" },
    { label: "Clients suivis", value: a.nbClients, cls: "text-status-pf" },
    { label: "Consultants suivis", value: a.nbConsultants, cls: "text-status-pf" },
    { label: "Besoins détectés", value: a.nbBesoinsDetectes, cls: "text-status-conforme" },
  ];

  // NPS (-100..100) projeté sur 0..100 pour l'anneau de jauge.
  const npsRing = a.nps == null ? null : Math.round((a.nps + 100) / 2);

  return (
    <div className="w-full">
      <ModuleTabs tabs={SUIVI_PRESTATION_TABS} />
      <PageHeader
        title="Analyse de l'écoute client"
        description="Synthèse des suivis de prestation, prête pour la revue de direction."
        isoClause="ISO 9001 §9.1.2 / §9.3"
        help="Le tableau agrège les comptes rendus de suivi de prestation : satisfaction, recommandation (NPS), axes de satisfaction, sécurité (QSSE), besoins détectés, points de vigilance et verbatims. Filtrez par année pour la revue de direction."
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <FiltreAnnee label="Toutes" value="toutes" actif={anneeActive == null} />
          {annees.map((y) => (
            <FiltreAnnee key={y} label={String(y)} value={String(y)} actif={anneeActive === y} />
          ))}
          {a.nbSuivis > 0 ? (
            <DownloadPdfButton
              printHref={`/print/suivi-prestation-analyse/${anneeActive ?? "toutes"}`}
              label="Export revue de direction"
            />
          ) : null}
        </div>
      </PageHeader>

      {a.nbSuivis === 0 ? (
        <EmptyState
          title="Aucun suivi sur cette période"
          description="Changez d'année ou partagez le lien du formulaire aux BM depuis l'onglet Comptes rendus."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <StatTiles tiles={tiles} />

          {/* Satisfaction globale, NPS, QSSE */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Satisfaction globale</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-5">
                <Jauge
                  pct={a.satPct}
                  value={a.satPct != null ? `${a.satPct}%` : "-"}
                  sub="satisfaits"
                  tone="conforme"
                />
                <div className="text-sm">
                  <p className="font-semibold text-3xl">{a.satMoyenne ?? "-"}</p>
                  <p className="text-muted-foreground">note moyenne / 5</p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    % de clients ayant mis 4 ou 5.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommandation (NPS)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-5">
                  <Jauge
                    pct={npsRing}
                    value={a.nps != null ? String(a.nps) : "-"}
                    sub={a.npsLabel}
                    tone="pf"
                  />
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-status-conforme">
                        {a.npsRepartition.promoteurs}
                      </span>{" "}
                      promoteurs ({a.npsRepartition.pctPromoteurs}%)
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        {a.npsRepartition.passifs}
                      </span>{" "}
                      passifs ({a.npsRepartition.pctPassifs}%)
                    </p>
                    <p>
                      <span className="font-medium text-status-nc-mineure">
                        {a.npsRepartition.detracteurs}
                      </span>{" "}
                      détracteurs ({a.npsRepartition.pctDetracteurs}%)
                    </p>
                  </div>
                </div>
                {a.npsRepartition.total > 0 ? (
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-status-conforme"
                      style={{ width: `${a.npsRepartition.pctPromoteurs}%` }}
                    />
                    <div
                      className="h-full bg-muted-foreground/40"
                      style={{ width: `${a.npsRepartition.pctPassifs}%` }}
                    />
                    <div
                      className="h-full bg-status-nc-mineure"
                      style={{ width: `${a.npsRepartition.pctDetracteurs}%` }}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conformité sécurité (QSSE)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-5">
                <Jauge
                  pct={a.conformiteQsse}
                  value={a.conformiteQsse != null ? `${a.conformiteQsse}%` : "-"}
                  sub="conformes"
                  tone="pa"
                />
                <p className="text-muted-foreground text-sm">
                  Part de réponses « Oui » sur les consignes, EPI et plan de prévention (les « sans
                  objet » sont ignorés).
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Zoom par axe de satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Zoom sur les items qui composent la satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SatisfactionBars items={a.axes.map((axe) => ({ label: axe.label, pct: axe.pct }))} />
            </CardContent>
          </Card>

          {/* Bilan qualitatif : points forts / axes d'amélioration */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Points forts</CardTitle>
              </CardHeader>
              <CardContent>
                <ComptageList items={a.pointsForts} total={a.nbSuivis} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Axes d'amélioration</CardTitle>
              </CardHeader>
              <CardContent>
                <ComptageList items={a.axesAmelioration} total={a.nbSuivis} />
              </CardContent>
            </Card>
          </div>

          {/* Besoins détectés */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Besoins de développement détectés</CardTitle>
            </CardHeader>
            <CardContent>
              <ComptageList items={a.besoins} total={a.nbSuivis} />
            </CardContent>
          </Card>

          {/* Points de vigilance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Points de vigilance ({a.vigilance.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {a.vigilance.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucune réclamation ni note basse sur la période.
                </p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {a.vigilance.map((v, i) => (
                    <li
                      // biome-ignore lint/suspicious/noArrayIndexKey: liste figée triée par date
                      key={`${v.client}-${v.date}-${i}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{v.client}</span>
                        {v.consultant !== "-" ? (
                          <span className="text-muted-foreground text-sm"> · {v.consultant}</span>
                        ) : null}
                        {v.mission ? (
                          <span className="text-muted-foreground text-sm"> · {v.mission}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-status-nc-mineure">{v.motif}</span>
                        <span className="text-muted-foreground text-xs">{formatDate(v.date)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Verbatims */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verbatims clients ({a.verbatims.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {a.verbatims.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun commentaire sur la période.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {a.verbatims.slice(0, 12).map((v, i) => (
                    <blockquote
                      // biome-ignore lint/suspicious/noArrayIndexKey: liste figée triée par date
                      key={`${v.client}-${i}`}
                      className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
                    >
                      <p className="italic">« {v.texte} »</p>
                      <footer className="mt-2 text-muted-foreground text-xs">
                        {v.client} · {v.origine}
                        {v.date ? ` · ${formatDate(v.date)}` : ""}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-xs">
            Analyse sur {periodeLabel} · {a.nbSuivis} compte{a.nbSuivis > 1 ? "s" : ""} rendu
            {a.nbSuivis > 1 ? "s" : ""}.
          </p>
        </div>
      )}
    </div>
  );
}

/** Puce de filtre par année (navigation par lien, sans JS). */
function FiltreAnnee({ label, value, actif }: { label: string; value: string; actif: boolean }) {
  return (
    <Link
      href={`/suivi-prestation/analyse?annee=${value}`}
      className={cn(
        "rounded-full border px-3 py-1 font-medium text-sm transition-colors",
        actif
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
