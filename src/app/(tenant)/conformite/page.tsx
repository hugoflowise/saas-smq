import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ChapterRow } from "./chapter-row";
import { type Cotation, DOMAINE_LABELS, DOMAINE_ORDER } from "./cotation-meta";

export default async function ConformitePage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Conformité ISO 9001"
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

  const { data: referentiel } = await supabase
    .from("referentiel_iso")
    .select("id, chapitre, intitule, preuves_attendues, domaine, ordre_affichage")
    .order("ordre_affichage", { ascending: true });

  const { data: evals } = await supabase
    .from("conformite_evaluation")
    .select("referentiel_iso_id, cotation, commentaire")
    .eq("tenant_id", tid);
  const evalByRef = new Map((evals ?? []).map((e) => [e.referentiel_iso_id, e]));

  const chapters = (referentiel ?? []).map((r) => {
    const e = evalByRef.get(r.id);
    return {
      ...r,
      cotation: (e?.cotation ?? "non_evalue") as Cotation,
      commentaire: e?.commentaire ?? "",
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
  const pctConforme = total > 0 ? Math.round((conformes / total) * 100) : 0;

  const stats = [
    { label: "Conformes", value: conformes, cls: "text-status-conforme" },
    { label: "Points d'attention", value: attention, cls: "text-status-pa" },
    { label: "Non-conformités", value: nc, cls: "text-status-nc-mineure" },
    { label: "Non évalués", value: nonEvalues, cls: "text-muted-foreground" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Conformité ISO 9001:2015"
        description="Auto-évaluation de la conformité par chapitre."
        isoClause="ISO 9001:2015"
        help="Auto-évaluez la conformité chapitre par chapitre pour mesurer votre taux de couverture et identifier les écarts à traiter avant l'audit de certification."
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
              <div className="rounded-lg border bg-card">
                {domChapters.map((c) => (
                  <ChapterRow
                    key={c.id}
                    referentielId={c.id}
                    chapitre={c.chapitre}
                    intitule={c.intitule}
                    preuves={c.preuves_attendues}
                    cotation={c.cotation}
                    commentaire={c.commentaire}
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
