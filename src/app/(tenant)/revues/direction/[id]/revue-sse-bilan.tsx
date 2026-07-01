import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { todayISO } from "@/lib/format";
import { REMONTEE_TYPE_LABELS } from "@/lib/labels";
import { type CotationType, calculerScoreMase, MASE_AXE_LABELS } from "@/lib/mase-score";
import { REFERENTIEL_NORMES } from "@/lib/modules";
import type { createClient } from "@/lib/supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

const REMONTEES_SSE = [
  "situation_dangereuse",
  "presqu_accident",
  "accident",
  "maladie_professionnelle",
  "impact_environnemental",
] as const;

function barClass(pct: number | null): string {
  if (pct == null) return "bg-muted-foreground/30";
  if (pct >= 80) return "bg-status-conforme";
  if (pct >= 50) return "bg-status-pa";
  return "bg-status-nc-majeure";
}

/**
 * Bilan SSE (MASE Axe 5) : synthèse annuelle agrégeant les 4 axes, présentée
 * comme donnée d'entrée de la revue de direction (lecture seule, data-driven).
 */
export async function RevueSseBilan({
  supabase,
  tenantId,
  annee,
}: {
  supabase: Supa;
  tenantId: string;
  annee: number;
}) {
  const tid = tenantId;
  const today = todayISO();
  const debutAnnee = `${annee}-01-01`;
  const finAnnee = `${annee}-12-31`;

  const [refRows, evalsMase, controles, analyses, remontees] = await Promise.all([
    supabase
      .from("referentiel_iso")
      .select("id, chapitre, axe, points_max, cotation_type, neutralisable")
      .in("norme", REFERENTIEL_NORMES.MASE)
      .not("axe", "is", null),
    supabase
      .from("conformite_evaluation")
      .select("referentiel_iso_id, points_obtenus, neutralisee")
      .eq("tenant_id", tid),
    supabase
      .from("controles_obligatoires")
      .select("statut, date_prochain")
      .eq("tenant_id", tid)
      .is("deleted_at", null),
    supabase
      .from("analyses_risques")
      .select("statut, date_revision")
      .eq("tenant_id", tid)
      .is("deleted_at", null),
    supabase
      .from("reclamations")
      .select("type")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .in("type", REMONTEES_SSE)
      .gte("date_reception", debutAnnee)
      .lte("date_reception", finAnnee),
  ]);

  // Score MASE par axe (même calcul que l'auto-diagnostic).
  const rows = refRows.data ?? [];
  const evalByRef = new Map((evalsMase.data ?? []).map((e) => [e.referentiel_iso_id, e]));
  const questions = rows.map((r) => ({
    chapitre: r.chapitre,
    axe: r.axe ?? 0,
    pointsMax: r.points_max ?? 0,
    cotationType: (r.cotation_type ?? "B") as CotationType,
    neutralisable: r.neutralisable ?? false,
  }));
  const reponses = new Map<string, { pointsObtenus: number | null; neutralisee: boolean }>();
  for (const r of rows) {
    const e = evalByRef.get(r.id);
    if (e)
      reponses.set(r.chapitre, { pointsObtenus: e.points_obtenus, neutralisee: e.neutralisee });
  }
  const score = calculerScoreMase(questions, reponses);

  const controlesList = controles.data ?? [];
  const controlesConformes = controlesList.filter((c) => c.statut === "conforme").length;
  const controlesEnRetard = controlesList.filter(
    (c) => c.date_prochain != null && c.date_prochain < today,
  ).length;

  const analysesList = analyses.data ?? [];
  const analysesValidees = analysesList.filter((a) => a.statut === "validee").length;
  const analysesAReviser = analysesList.filter(
    (a) =>
      a.statut === "a_reviser" ||
      (a.statut !== "archivee" && a.date_revision != null && a.date_revision <= today),
  ).length;

  const remonteesList = remontees.data ?? [];
  const parType = new Map<string, number>();
  for (const r of remonteesList) parType.set(r.type, (parType.get(r.type) ?? 0) + 1);

  const cells = [
    { label: "Score MASE global", value: score.pct == null ? "-" : `${score.pct}%` },
    { label: "Contrôles conformes", value: `${controlesConformes}/${controlesList.length}` },
    { label: "Contrôles en retard", value: controlesEnRetard },
    { label: "Analyses validées", value: `${analysesValidees}/${analysesList.length}` },
    { label: "Analyses à réviser", value: analysesAReviser },
    ...REMONTEES_SSE.map((t) => ({
      label: REMONTEE_TYPE_LABELS[t],
      value: parType.get(t) ?? 0,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bilan SSE {annee} (MASE Axe 5)</CardTitle>
        <p className="mt-1 text-muted-foreground text-xs">
          Synthèse agrégée des axes SSE, à examiner en revue : score de l'auto-diagnostic par axe,
          contrôles réglementaires, analyses de risques et événements SSE de l'année.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          {score.axes.map((a) => (
            <div key={a.axe} className="flex items-center gap-3 text-sm">
              <span className="w-64 shrink-0 truncate text-muted-foreground text-xs">
                {MASE_AXE_LABELS[a.axe] ?? `Axe ${a.axe}`}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${barClass(a.pct)}`}
                  style={{ width: `${a.pct ?? 0}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-medium text-xs">
                {a.pct == null ? "-" : `${a.pct}%`}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cells.map((c) => (
            <div key={c.label} className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="font-semibold text-lg">{c.value}</p>
              <p className="mt-0.5 text-muted-foreground text-xs">{c.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
