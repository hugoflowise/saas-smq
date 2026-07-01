import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADR_STATUT_LABELS, type AdrStatut } from "@/lib/adr";
import { joursAvantEcheance } from "@/lib/controles";
import { formatDate, todayISO } from "@/lib/format";
import { type CotationType, calculerScoreMase } from "@/lib/mase-score";
import { REFERENTIEL_NORMES } from "@/lib/modules";
import { createClient } from "@/lib/supabase/server";

// Types de remontée relevant du SSE (MASE Axe 4).
const REMONTEES_SSE = [
  "situation_dangereuse",
  "presqu_accident",
  "accident",
  "maladie_professionnelle",
  "impact_environnemental",
] as const;

function pctClass(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 80) return "text-status-conforme";
  if (pct >= 50) return "text-status-pa";
  return "text-status-nc-majeure";
}

/** Bloc santé-sécurité-environnement du tableau de bord (MASE / 45001). */
export async function SseDashboardSection({ tenantId }: { tenantId: string }) {
  const supabase = await createClient();
  const tid = tenantId;
  const today = todayISO();

  const [refRows, evalsMase, controles, analyses, remonteesSse] = await Promise.all([
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
      .select("id, intitule, date_prochain, statut")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .not("date_prochain", "is", null)
      .order("date_prochain", { ascending: true }),
    supabase
      .from("analyses_risques")
      .select("id, intitule, statut, date_revision")
      .eq("tenant_id", tid)
      .is("deleted_at", null),
    supabase
      .from("reclamations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .neq("statut", "cloturee")
      .in("type", REMONTEES_SSE),
  ]);

  // Score MASE (même calcul que l'auto-diagnostic).
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
  const controlesEnRetard = controlesList.filter(
    (c) => c.date_prochain != null && joursAvantEcheance(c.date_prochain, today) < 0,
  );
  const controlesProches = controlesList.filter((c) => {
    if (c.date_prochain == null) return false;
    const j = joursAvantEcheance(c.date_prochain, today);
    return j >= 0 && j <= 60;
  });

  const analysesList = analyses.data ?? [];
  const analysesAReviser = analysesList.filter(
    (a) =>
      a.statut === "a_reviser" ||
      (a.statut !== "archivee" && a.date_revision != null && a.date_revision <= today),
  );

  const stats = [
    {
      label: "Score MASE",
      value: score.pct == null ? "-" : `${score.pct}%`,
      href: "/conformite",
      cls: pctClass(score.pct),
    },
    {
      label: "Contrôles en retard",
      value: controlesEnRetard.length,
      href: "/sst/controles",
      cls: controlesEnRetard.length > 0 ? "text-status-nc-majeure" : "text-foreground",
    },
    {
      label: "Analyses à réviser",
      value: analysesAReviser.length,
      href: "/sst/analyses-risques",
      cls: analysesAReviser.length > 0 ? "text-status-pa" : "text-foreground",
    },
    {
      label: "Remontées SSE ouvertes",
      value: remonteesSse.count ?? 0,
      href: "/reclamations",
      cls: (remonteesSse.count ?? 0) > 0 ? "text-status-pa" : "text-foreground",
    },
  ];

  const controlesAlerte = [...controlesEnRetard, ...controlesProches].slice(0, 6);

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
        Santé, sécurité & environnement
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="py-5">
                <p className={`font-semibold text-3xl ${s.cls}`}>{s.value}</p>
                <p className="mt-1 text-muted-foreground text-xs">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contrôles obligatoires à échéance</CardTitle>
          </CardHeader>
          <CardContent>
            {controlesAlerte.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun contrôle en retard ou proche. 👍
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {controlesAlerte.map((c) => {
                  const enRetard =
                    c.date_prochain != null && joursAvantEcheance(c.date_prochain, today) < 0;
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Link
                        href="/sst/controles"
                        className="min-w-0 truncate hover:text-primary hover:underline"
                      >
                        {c.intitule}
                      </Link>
                      <span
                        className={`shrink-0 text-xs ${enRetard ? "text-status-nc-majeure" : "text-status-pa"}`}
                      >
                        {c.date_prochain ? formatDate(c.date_prochain) : ""}
                        {enRetard ? " · en retard" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/sst/controles" className="text-primary text-sm hover:underline">
                Voir les contrôles obligatoires →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analyses de risques à réviser</CardTitle>
          </CardHeader>
          <CardContent>
            {analysesAReviser.length === 0 ? (
              <p className="text-muted-foreground text-sm">Toutes les analyses sont à jour. 👍</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {analysesAReviser.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <Link
                      href={`/sst/analyses-risques/${a.id}`}
                      className="min-w-0 truncate hover:text-primary hover:underline"
                    >
                      {a.intitule}
                    </Link>
                    <span className="shrink-0 text-status-pa text-xs">
                      {a.date_revision
                        ? formatDate(a.date_revision)
                        : (ADR_STATUT_LABELS[a.statut as AdrStatut] ?? a.statut)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/sst/analyses-risques" className="text-primary text-sm hover:underline">
                Voir les analyses de risques →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
