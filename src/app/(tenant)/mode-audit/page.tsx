import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateLimiteReevaluation, estAReevaluer } from "@/lib/conformite";
import { dateOffsetISO, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { PrintButton } from "./print-button";

const NC_OUVERTES = ["ouverte", "analysee", "action_definie"] as const;
const ACTIONS_ACTIVES = ["a_faire", "en_cours", "bloquee"] as const;
const AUDITS_REALISES = ["realise", "rapport_redige", "cloture"] as const;

type Check = { label: string; value: string; ok: boolean; href: string };

function CheckRow({ check }: { check: Check }) {
  return (
    <Link
      href={check.href}
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
    >
      {check.ok ? (
        <CheckCircle2 className="size-4 shrink-0 text-status-conforme" />
      ) : (
        <AlertTriangle className="size-4 shrink-0 text-status-pa" />
      )}
      <span className="min-w-0 flex-1 text-sm">{check.label}</span>
      <span className="shrink-0 text-muted-foreground text-xs">{check.value}</span>
      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground print:hidden" />
    </Link>
  );
}

export default async function ModeAuditPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Mode audit" description="Dossier de préparation à l'audit ISO 9001." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;
  const today = todayISO();
  const horizon60 = dateOffsetISO(60);

  const count = (q: { count: number | null }) => q.count ?? 0;

  const [
    refTotal,
    evals,
    contexte,
    parties,
    processusTotal,
    processusAReviser,
    politique,
    risques,
    objectifsTotal,
    objectifsAtteints,
    proceduresPubliees,
    indicateurs,
    reclamationsTotal,
    reclamationsOuvertes,
    auditsRealises,
    revues,
    ncOuvertes,
    ncMajeures,
    actionsRetard,
  ] = await Promise.all([
    supabase.from("referentiel_iso").select("id", { count: "exact", head: true }),
    supabase.from("conformite_evaluation").select("cotation, date_evaluation").eq("tenant_id", tid),
    supabase
      .from("contexte_organisme")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid),
    supabase
      .from("parties_interessees")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid),
    supabase.from("processus").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
    supabase
      .from("processus")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .not("date_prochaine_revue", "is", null)
      .lte("date_prochaine_revue", horizon60),
    supabase.from("politique_qualite").select("statut").eq("tenant_id", tid).maybeSingle(),
    supabase
      .from("risques_opportunites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid),
    supabase
      .from("objectifs_qualite")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid),
    supabase
      .from("objectifs_qualite")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .eq("statut", "atteint"),
    supabase
      .from("procedures")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .eq("statut", "publiee"),
    supabase.from("indicateurs").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
    supabase.from("reclamations").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
    supabase
      .from("reclamations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .neq("statut", "cloturee"),
    supabase
      .from("audits_internes")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .in("statut", [...AUDITS_REALISES]),
    supabase
      .from("revues_direction")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid),
    supabase
      .from("non_conformites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .in("statut", [...NC_OUVERTES]),
    supabase
      .from("non_conformites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .in("statut", [...NC_OUVERTES])
      .in("gravite", ["majeure", "critique"] as ("mineure" | "majeure" | "critique")[]),
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .in("statut", [...ACTIONS_ACTIVES])
      .lt("date_prevue", today),
  ]);

  const refCount = count(refTotal);
  const conformes = (evals.data ?? []).filter(
    (e) => e.cotation === "conforme" || e.cotation === "point_fort",
  ).length;
  const pctConforme = refCount > 0 ? Math.round((conformes / refCount) * 100) : 0;
  const limiteReeval = dateLimiteReevaluation(today);
  const cotationsAReevaluer = (evals.data ?? []).filter((e) =>
    estAReevaluer(e.cotation, e.date_evaluation, limiteReeval),
  ).length;
  const politiePubliee = politique.data?.statut === "publiee";

  const communications = await supabase
    .from("communications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid);
  const satisfaction = await supabase
    .from("enquetes_satisfaction")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid);
  const fournisseurs = await supabase
    .from("fournisseurs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid);

  const chapitres: { num: string; titre: string; checks: Check[] }[] = [
    {
      num: "4",
      titre: "Contexte de l'organisme",
      checks: [
        {
          label: "Analyse de contexte (SWOT / PESTEL)",
          value: count(contexte) > 0 ? "Renseignée" : "À faire",
          ok: count(contexte) > 0,
          href: "/strategie/contexte",
        },
        {
          label: "Parties intéressées identifiées",
          value: `${count(parties)}`,
          ok: count(parties) > 0,
          href: "/strategie/parties-prenantes",
        },
        {
          label: "Cartographie des processus",
          value: `${count(processusTotal)} processus`,
          ok: count(processusTotal) > 0,
          href: "/processus",
        },
      ],
    },
    {
      num: "5",
      titre: "Leadership",
      checks: [
        {
          label: "Politique qualité publiée",
          value: politiePubliee ? "Publiée" : "Non publiée",
          ok: politiePubliee,
          href: "/strategie/politique",
        },
      ],
    },
    {
      num: "6",
      titre: "Planification",
      checks: [
        {
          label: "Risques & opportunités déterminés",
          value: `${count(risques)}`,
          ok: count(risques) > 0,
          href: "/risques",
        },
        {
          label: "Objectifs qualité (atteints / total)",
          value: `${count(objectifsAtteints)} / ${count(objectifsTotal)}`,
          ok: count(objectifsTotal) > 0,
          href: "/strategie/objectifs",
        },
      ],
    },
    {
      num: "7",
      titre: "Support",
      checks: [
        {
          label: "Procédures publiées (maîtrise documentaire)",
          value: `${count(proceduresPubliees)}`,
          ok: count(proceduresPubliees) > 0,
          href: "/documentation/procedures",
        },
        {
          label: "Indicateurs de performance définis",
          value: `${count(indicateurs)}`,
          ok: count(indicateurs) > 0,
          href: "/indicateurs",
        },
        {
          label: "Communications planifiées (§7.4)",
          value: `${count(communications)}`,
          ok: count(communications) > 0,
          href: "/communications",
        },
      ],
    },
    {
      num: "8",
      titre: "Réalisation des activités",
      checks: [
        {
          label: "Réclamations clients suivies",
          value: `${count(reclamationsOuvertes)} ouverte(s) / ${count(reclamationsTotal)}`,
          ok: true,
          href: "/reclamations",
        },
        {
          label: "Fournisseurs évalués (§8.4)",
          value: `${count(fournisseurs)}`,
          ok: count(fournisseurs) > 0,
          href: "/fournisseurs",
        },
      ],
    },
    {
      num: "9",
      titre: "Évaluation des performances",
      checks: [
        {
          label: "Conformité ISO auto-évaluée",
          value: `${pctConforme}%`,
          ok: pctConforme >= 80,
          href: "/conformite",
        },
        {
          label: "Cotations à réévaluer (> 12 mois)",
          value: `${cotationsAReevaluer}`,
          ok: cotationsAReevaluer === 0,
          href: "/conformite",
        },
        {
          label: "Audits internes réalisés",
          value: `${count(auditsRealises)}`,
          ok: count(auditsRealises) > 0,
          href: "/audits",
        },
        {
          label: "Revues de direction",
          value: `${count(revues)}`,
          ok: count(revues) > 0,
          href: "/revues/direction",
        },
        {
          label: "Satisfaction client mesurée (NPS)",
          value: `${count(satisfaction)} réponse(s)`,
          ok: count(satisfaction) > 0,
          href: "/satisfaction",
        },
        {
          label: "Processus à réviser (≤ 60 j ou échus)",
          value: `${count(processusAReviser)}`,
          ok: count(processusAReviser) === 0,
          href: "/processus",
        },
      ],
    },
    {
      num: "10",
      titre: "Amélioration",
      checks: [
        {
          label: "Non-conformités majeures ouvertes",
          value: `${count(ncMajeures)}`,
          ok: count(ncMajeures) === 0,
          href: "/nc",
        },
        {
          label: "Non-conformités ouvertes (total)",
          value: `${count(ncOuvertes)}`,
          ok: true,
          href: "/nc",
        },
        {
          label: "Actions en retard",
          value: `${count(actionsRetard)}`,
          ok: count(actionsRetard) === 0,
          href: "/actions",
        },
      ],
    },
  ];

  const totalChecks = chapitres.flatMap((c) => c.checks).length;
  const okChecks = chapitres.flatMap((c) => c.checks).filter((c) => c.ok).length;

  const tiles = [
    { label: "Conformité ISO", value: `${pctConforme}%`, cls: "text-status-conforme" },
    { label: "Points conformes", value: `${okChecks}/${totalChecks}`, cls: "text-foreground" },
    { label: "NC majeures ouvertes", value: count(ncMajeures), cls: "text-status-nc-majeure" },
    { label: "Actions en retard", value: count(actionsRetard), cls: "text-status-pa" },
    { label: "Processus à réviser", value: count(processusAReviser), cls: "text-status-pa" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Mode audit"
        description="Dossier de préparation à l'audit, organisé par chapitre de la norme ISO 9001:2015."
        isoClause="ISO 9001:2015"
        help="Vue de synthèse présentable à un auditeur : pour chaque chapitre de la norme, l'état des éléments de preuve (vert = en place, ambre = à compléter). Cliquez un point pour ouvrir le module concerné. Bouton Imprimer pour un dossier PDF."
      >
        <PrintButton />
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="py-5">
              <p className={`font-semibold text-3xl ${t.cls}`}>{t.value}</p>
              <p className="mt-1 text-muted-foreground text-xs">{t.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {chapitres.map((ch) => (
          <Card key={ch.num}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
                  {ch.num}
                </span>
                {ch.titre}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              {ch.checks.map((check) => (
                <CheckRow key={check.label} check={check} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
