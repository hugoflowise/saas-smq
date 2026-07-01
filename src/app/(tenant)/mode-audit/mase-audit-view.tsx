import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { type CotationType, calculerScoreMase, MASE_AXE_LABELS } from "@/lib/mase-score";
import { REFERENTIEL_NORMES } from "@/lib/modules";
import { createClient } from "@/lib/supabase/server";

function pctClass(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 80) return "text-status-conforme";
  if (pct >= 50) return "text-status-pa";
  return "text-status-nc-majeure";
}
function barClass(pct: number | null): string {
  if (pct == null) return "bg-muted-foreground/30";
  if (pct >= 80) return "bg-status-conforme";
  if (pct >= 50) return "bg-status-pa";
  return "bg-status-nc-majeure";
}

/** Dossier d'audit MASE : score de l'auto-diagnostic par axe (1 à 5). */
export async function MaseAuditView({ tenantId }: { tenantId: string }) {
  const supabase = await createClient();

  const { data: refRows } = await supabase
    .from("referentiel_iso")
    .select("id, chapitre, axe, points_max, cotation_type, neutralisable")
    .in("norme", REFERENTIEL_NORMES.MASE)
    .not("axe", "is", null)
    .order("ordre_affichage", { ascending: true });

  const rows = refRows ?? [];

  const { data: evals } = await supabase
    .from("conformite_evaluation")
    .select("referentiel_iso_id, points_obtenus, neutralisee")
    .eq("tenant_id", tenantId);
  const evalByRef = new Map((evals ?? []).map((e) => [e.referentiel_iso_id, e]));

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

  return (
    <div className="mb-8">
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/conformite" className="block">
          <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/40">
            <CardContent className="py-5">
              <p className={`font-semibold text-3xl ${pctClass(score.pct)}`}>
                {score.pct == null ? "-" : `${score.pct}%`}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">Score MASE global</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="h-full">
          <CardContent className="py-5">
            <p className="font-semibold text-3xl text-foreground">
              {score.totalObtenus}
              <span className="text-muted-foreground text-lg"> / {score.totalMax}</span>
            </p>
            <p className="mt-1 text-muted-foreground text-xs">Points obtenus</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="py-5">
            <p className="font-semibold text-3xl text-foreground">
              {score.axes.reduce((s, a) => s + a.nbEvaluees, 0)}
              <span className="text-muted-foreground text-lg"> / {questions.length}</span>
            </p>
            <p className="mt-1 text-muted-foreground text-xs">Questions évaluées</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="py-5">
            <p className="font-semibold text-3xl text-foreground">
              {score.axes.reduce((s, a) => s + a.nbNeutralisees, 0)}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">Questions neutralisées</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {score.axes.map((a) => (
          <Link key={a.axe} href="/conformite" className="block">
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/40">
              <CardContent className="flex flex-col gap-3 py-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-sm">
                    {MASE_AXE_LABELS[a.axe] ?? `Axe ${a.axe}`}
                  </span>
                  <span className={`font-semibold text-lg ${pctClass(a.pct)}`}>
                    {a.pct == null ? "-" : `${a.pct}%`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${barClass(a.pct)}`}
                    style={{ width: `${a.pct ?? 0}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {a.obtenus} / {a.max} points · {a.nbEvaluees}/{a.nbQuestions} évaluées
                  {a.nbNeutralisees > 0 ? ` · ${a.nbNeutralisees} neutralisée(s)` : ""}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
