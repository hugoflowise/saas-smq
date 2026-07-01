import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { dateLimiteReevaluation, estAReevaluer } from "@/lib/conformite";
import { todayISO } from "@/lib/format";
import {
  type CotationType,
  calculerScoreMase,
  MASE_AXE_LABELS,
  type MaseQuestion,
  type MaseReponse,
} from "@/lib/mase-score";
import { normalizeNormes, REFERENTIEL_NORMES } from "@/lib/modules";
import { getNormesActives } from "@/lib/normes-actives";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ChapterRow } from "./chapter-row";
import { type Cotation, DOMAINE_LABELS, DOMAINE_ORDER } from "./cotation-meta";
import { MaseQuestionRow } from "./mase-question-row";

function progressClass(pct: number) {
  if (pct >= 80) return "bg-status-conforme";
  if (pct >= 50) return "bg-status-pa";
  return "bg-status-nc-mineure";
}

export default async function ConformitePage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Auto-diagnostic"
          description="Auto-évaluation de la conformité par chapitre."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour évaluer sa conformité."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  // Filtre par norme : le référentiel est global (toutes normes confondues), on
  // ne montre au client que le(s) référentiel(s) de ses normes actives. Sans ce
  // filtre, un client 9001 verrait aussi les questions MASE (et inversement).
  const normes = await getNormesActives();
  const normesReferentiel = normalizeNormes(normes).flatMap((c) => REFERENTIEL_NORMES[c]);

  const { data: referentiel } = await supabase
    .from("referentiel_iso")
    .select(
      "id, chapitre, intitule, preuves_attendues, domaine, axe, points_max, cotation_type, neutralisable, ordre_affichage",
    )
    .in("norme", normesReferentiel)
    .order("ordre_affichage", { ascending: true });

  const { data: evals } = await supabase
    .from("conformite_evaluation")
    .select(
      "referentiel_iso_id, cotation, commentaire, date_evaluation, points_obtenus, neutralisee",
    )
    .eq("tenant_id", tid);
  const evalByRef = new Map((evals ?? []).map((e) => [e.referentiel_iso_id, e]));

  const rows = referentiel ?? [];
  const isoRows = rows.filter((r) => r.domaine != null);
  const maseRows = rows.filter((r) => r.axe != null);

  return (
    <div className="w-full">
      <PageHeader
        title="Auto-diagnostic"
        description="Auto-évaluation de la conformité, chapitre par chapitre."
        concept="referentiels"
        help="Auto-évaluez votre conformité pour mesurer votre couverture et identifier les écarts à traiter avant l'audit de certification. Pour ISO 9001, chaque cotation conforme est à réévaluer au bout de 12 mois. Pour MASE, chaque question est notée (points selon le référentiel) : le score se lit par axe et au global."
      />

      {isoRows.length > 0 ? <VueIso rows={isoRows} evalByRef={evalByRef} /> : null}
      {maseRows.length > 0 ? <VueMase rows={maseRows} evalByRef={evalByRef} /> : null}

      {isoRows.length === 0 && maseRows.length === 0 ? (
        <EmptyState
          title="Référentiel non disponible"
          description="Aucun référentiel n'est chargé pour vos normes actives."
        />
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ Vue ISO 9001
type EvalRow = {
  cotation: Cotation;
  commentaire: string | null;
  date_evaluation: string | null;
  points_obtenus: number | null;
  neutralisee: boolean;
};

function VueIso({
  rows,
  evalByRef,
}: {
  rows: {
    id: string;
    chapitre: string;
    intitule: string;
    preuves_attendues: string | null;
    domaine: string | null;
  }[];
  evalByRef: Map<string, EvalRow>;
}) {
  const limiteReeval = dateLimiteReevaluation(todayISO());
  const chapters = rows.map((r) => {
    const e = evalByRef.get(r.id);
    const cotation = (e?.cotation ?? "non_evalue") as Cotation;
    const dateEvaluation = e?.date_evaluation ?? null;
    return {
      ...r,
      cotation,
      commentaire: e?.commentaire ?? "",
      dateEvaluation,
      aReevaluer: estAReevaluer(cotation, dateEvaluation, limiteReeval),
    };
  });

  const total = chapters.length;
  const conformes = chapters.filter(
    (c) => c.cotation === "conforme" || c.cotation === "point_fort",
  ).length;
  const nc = chapters.filter(
    (c) => c.cotation === "nc_mineure" || c.cotation === "nc_majeure",
  ).length;
  const attention = chapters.filter((c) => c.cotation === "point_attention").length;
  const nonEvalues = chapters.filter((c) => c.cotation === "non_evalue").length;
  const aReevaluer = chapters.filter((c) => c.aReevaluer).length;
  const pctConforme = total > 0 ? Math.round((conformes / total) * 100) : 0;

  const stats = [
    { label: "Conformes", value: conformes, cls: "text-status-conforme" },
    { label: "À réévaluer", value: aReevaluer, cls: "text-status-pa" },
    { label: "Points d'attention", value: attention, cls: "text-status-pa" },
    { label: "Non-conformités", value: nc, cls: "text-status-nc-mineure" },
    { label: "Non évalués", value: nonEvalues, cls: "text-muted-foreground" },
  ];

  return (
    <>
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-6 py-5">
          <div>
            <p className="font-semibold text-3xl text-status-conforme">{pctConforme}%</p>
            <p className="text-muted-foreground text-xs">conforme (ISO 9001)</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className={`font-semibold text-2xl ${s.cls}`}>{s.value}</p>
                <p className="text-muted-foreground text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 flex flex-col gap-6">
        {DOMAINE_ORDER.map((dom) => {
          const domChapters = chapters.filter((c) => c.domaine === dom);
          if (domChapters.length === 0) return null;
          return (
            <div key={dom}>
              <h2 className="mb-2 font-semibold text-sm">{DOMAINE_LABELS[dom] ?? dom}</h2>
              <div className="rounded-2xl border bg-card">
                {domChapters.map((c) => (
                  <ChapterRow
                    key={c.id}
                    referentielId={c.id}
                    chapitre={c.chapitre}
                    intitule={c.intitule}
                    preuves={c.preuves_attendues}
                    cotation={c.cotation}
                    commentaire={c.commentaire}
                    aReevaluer={c.aReevaluer}
                    dateEvaluation={c.dateEvaluation}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Vue MASE (notée)
function VueMase({
  rows,
  evalByRef,
}: {
  rows: {
    id: string;
    chapitre: string;
    intitule: string;
    axe: number | null;
    points_max: number | null;
    cotation_type: string | null;
    neutralisable: boolean;
  }[];
  evalByRef: Map<string, EvalRow>;
}) {
  const questions: MaseQuestion[] = rows.map((r) => ({
    chapitre: r.chapitre,
    axe: r.axe ?? 0,
    pointsMax: r.points_max ?? 0,
    cotationType: (r.cotation_type ?? "B") as CotationType,
    neutralisable: r.neutralisable,
  }));
  const reponses = new Map<string, MaseReponse>();
  for (const r of rows) {
    const e = evalByRef.get(r.id);
    if (e)
      reponses.set(r.chapitre, { pointsObtenus: e.points_obtenus, neutralisee: e.neutralisee });
  }
  const score = calculerScoreMase(questions, reponses);

  // Regroupement des lignes par axe (ordre du référentiel préservé).
  const axesPresents = [...new Set(rows.map((r) => r.axe ?? 0))].sort((a, b) => a - b);

  return (
    <>
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="font-semibold text-3xl">{score.pct ?? 0}%</p>
              <p className="text-muted-foreground text-xs">
                score MASE global ({score.totalObtenus} / {score.totalMax} pts)
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {score.axes.map((a) => (
              <div key={a.axe} className="flex items-center gap-3 text-sm">
                <span className="w-56 shrink-0 truncate text-muted-foreground">
                  {MASE_AXE_LABELS[a.axe] ?? `Axe ${a.axe}`}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${progressClass(a.pct ?? 0)}`}
                    style={{ width: `${a.pct ?? 0}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right tabular-nums">
                  {a.obtenus} / {a.max} pts
                </span>
                <span className="w-10 shrink-0 text-right font-medium tabular-nums">
                  {a.pct ?? 0}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        {axesPresents.map((axe) => {
          const axeRows = rows.filter((r) => (r.axe ?? 0) === axe);
          return (
            <div key={axe}>
              <h2 className="mb-2 font-semibold text-sm">{MASE_AXE_LABELS[axe] ?? `Axe ${axe}`}</h2>
              <div className="rounded-2xl border bg-card">
                {axeRows.map((r) => {
                  const e = evalByRef.get(r.id);
                  return (
                    <MaseQuestionRow
                      key={r.id}
                      referentielId={r.id}
                      chapitre={r.chapitre}
                      intitule={r.intitule}
                      pointsMax={r.points_max ?? 0}
                      cotationType={(r.cotation_type ?? "B") as CotationType}
                      neutralisable={r.neutralisable}
                      pointsObtenus={e?.points_obtenus ?? null}
                      neutralisee={e?.neutralisee ?? false}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
