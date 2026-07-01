import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { dateLimiteReevaluation, estAReevaluer } from "@/lib/conformite";
import { todayISO } from "@/lib/format";
import { normalizeNormes, REFERENTIEL_NORME } from "@/lib/modules";
import { getNormesActives } from "@/lib/normes-actives";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ChapterRow } from "./chapter-row";
import { type Cotation, DOMAINE_LABELS, DOMAINE_ORDER } from "./cotation-meta";

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
  const normesReferentiel = normalizeNormes(normes).map((c) => REFERENTIEL_NORME[c]);

  const { data: referentiel } = await supabase
    .from("referentiel_iso")
    .select("id, chapitre, intitule, preuves_attendues, domaine, ordre_affichage")
    .in("norme", normesReferentiel)
    .order("ordre_affichage", { ascending: true });

  const { data: evals } = await supabase
    .from("conformite_evaluation")
    .select("referentiel_iso_id, cotation, commentaire, date_evaluation")
    .eq("tenant_id", tid);
  const evalByRef = new Map((evals ?? []).map((e) => [e.referentiel_iso_id, e]));

  const limiteReeval = dateLimiteReevaluation(todayISO());
  const chapters = (referentiel ?? []).map((r) => {
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

  // Synthèse
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
    <div className="w-full">
      <PageHeader
        title="Auto-diagnostic"
        description="Auto-évaluation de la conformité, chapitre par chapitre."
        concept="referentiels"
        help="Auto-évaluez la conformité chapitre par chapitre pour mesurer votre taux de couverture et identifier les écarts à traiter avant l'audit de certification. Chaque cotation conforme est à réévaluer au bout de 12 mois (badge « À réévaluer ») : un diagnostic n'est jamais acquis définitivement."
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-6 py-5">
          <div>
            <p className="font-semibold text-3xl text-status-conforme">{pctConforme}%</p>
            <p className="text-muted-foreground text-xs">conforme</p>
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

      <div className="flex flex-col gap-6">
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
    </div>
  );
}
