import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { ACTION_STATUT_LABELS } from "@/lib/labels";
import { computeRevuePerformance, type RevuePerformance, revuePerfCells } from "@/lib/revue-perf";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { RevueDialog } from "../revue-dialog";
import { RevueActionForm } from "./revue-action-form";
import { RevuePerformanceCapture } from "./revue-performance-capture";
import type { RevueParticipant } from "./revue-structure-editor";
import { RevueStructureEditor } from "./revue-structure-editor";

const STATUT_LABELS: Record<string, string> = {
  planifiee: "Planifiée",
  realisee: "Réalisée",
  cloturee: "Clôturée",
};

export default async function RevueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/revues/direction");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: revue } = await supabase
    .from("revues_direction")
    .select(
      "id, annee, date_realisation, statut, ordre_du_jour, conclusions, decisions, donnees_performance, donnees_capturees_le, entree_actions_anterieures, entree_evolution_contexte, entree_performance_synthese, entree_ressources, entree_efficacite_actions, entree_opportunites, sortie_amelioration, sortie_changements, sortie_ressources, participants, points_specifiques",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!revue) notFound();

  // Données de performance : instantané figé si capturé, sinon valeurs vivantes.
  const snapshot = revue.donnees_performance as RevuePerformance | null;
  const perf = snapshot ?? (await computeRevuePerformance(supabase, tid, revue.annee));

  // Actions décidées en revue (§9.3.3) rattachées à cette revue.
  const { data: linkedActions } = await supabase
    .from("actions")
    .select("id, reference, description_courte, statut")
    .eq("tenant_id", tid)
    .eq("revue_id", id)
    .is("deleted_at", null)
    .order("date_creation", { ascending: false });
  const actions = linkedActions ?? [];

  return (
    <div className="w-full">
      <Link
        href="/revues/direction"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Revues de direction
      </Link>

      <PageHeader
        title={`Revue de direction ${revue.annee}`}
        description={`${STATUT_LABELS[revue.statut] ?? revue.statut}${
          revue.date_realisation ? ` · ${formatDate(revue.date_realisation)}` : ""
        }`}
        isoClause="ISO 9001 §9.3"
        help="Structurez les éléments d'entrée (§9.3.2 a→f) et de sortie (§9.3.3) de la revue. Les données de performance peuvent être pré-remplies depuis le pilotage."
      >
        <DownloadPdfButton printHref={`/print/revue/${id}`} label="Compte rendu (PDF)" />
        <RevueDialog revue={revue} />
      </PageHeader>

      <div className="flex flex-col gap-6">
        {/* §9.3.2 c — Données de performance du SMQ */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Performance du SMQ (§9.3.2 c)</CardTitle>
              <p className="mt-1 text-muted-foreground text-xs">
                {revue.donnees_capturees_le
                  ? `Données figées le ${formatDate(revue.donnees_capturees_le)}.`
                  : "Données vivantes (non figées) — capturez-les pour conserver la trace examinée en revue."}
              </p>
            </div>
            <RevuePerformanceCapture
              revueId={revue.id}
              recapture={Boolean(revue.donnees_capturees_le)}
            />
          </CardHeader>
          <CardContent>
            <PerformanceGrid perf={perf} />
          </CardContent>
        </Card>

        {/* §9.3.2 a→f + §9.3.3 — éléments d'entrée / sortie */}
        <RevueStructureEditor
          initial={{
            id: revue.id,
            participants: (revue.participants as RevueParticipant[]) ?? [],
            pointsSpecifiques: revue.points_specifiques ?? "",
            entreeActionsAnterieures: revue.entree_actions_anterieures ?? "",
            entreeEvolutionContexte: revue.entree_evolution_contexte ?? "",
            entreePerformanceSynthese: revue.entree_performance_synthese ?? "",
            entreeRessources: revue.entree_ressources ?? "",
            entreeEfficaciteActions: revue.entree_efficacite_actions ?? "",
            entreeOpportunites: revue.entree_opportunites ?? "",
            sortieAmelioration: revue.sortie_amelioration ?? "",
            sortieChangements: revue.sortie_changements ?? "",
            sortieRessources: revue.sortie_ressources ?? "",
          }}
        />

        {/* §9.3.3 — actions décidées rattachées à la revue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Actions décidées (§9.3.3)</CardTitle>
            <RevueActionForm revueId={revue.id} />
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune action rattachée. Les décisions d'amélioration peuvent générer des actions
                tracées dans le plan d'actions.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {actions.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <Link
                      href={`/actions/${a.id}`}
                      className="min-w-0 truncate hover:text-primary hover:underline"
                    >
                      <span className="font-mono text-muted-foreground text-xs">{a.reference}</span>{" "}
                      {a.description_courte}
                    </Link>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {ACTION_STATUT_LABELS[a.statut as keyof typeof ACTION_STATUT_LABELS] ??
                        a.statut}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PerformanceGrid({ perf }: { perf: RevuePerformance }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {revuePerfCells(perf).map((c) => (
        <div key={c.label} className="rounded-lg border bg-muted/30 px-3 py-2.5">
          <p className="font-semibold text-lg">{c.value}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
