import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { COTATION_LABELS } from "@/app/(tenant)/conformite/cotation-meta";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BADGE_BASE, COTATION_BADGE_CLASS } from "@/lib/badges";
import { formatDate } from "@/lib/format";
import {
  ACTION_ORIGINE_LABELS,
  ACTION_PRIORITE_LABELS,
  ACTION_STATUT_LABELS,
  ACTION_TYPE_LABELS,
} from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ActionDialog } from "../action-dialog";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export default async function ActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/actions");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: action } = await supabase
    .from("actions")
    .select(
      "id, reference, description_courte, description_detail, origine, type, priorite, statut, processus_concerne, date_prevue, date_effective, indicateur_efficacite, commentaires, constat, cause_fondamentale, recommandation, cotation",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!action) notFound();

  const { data: processusOptions } = await supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", tid)
    .order("ordre_affichage", { ascending: true });

  const processusNom = action.processus_concerne
    ? ((processusOptions ?? []).find((p) => p.id === action.processus_concerne)?.nom ?? "—")
    : "—";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/actions"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Plan d'actions
      </Link>

      <PageHeader title={action.description_courte}>
        <ActionDialog processusOptions={processusOptions ?? []} action={action} />
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="font-mono text-muted-foreground text-xs">{action.reference}</span>
        <Badge variant="secondary">{ACTION_STATUT_LABELS[action.statut]}</Badge>
        <Badge variant="secondary">{ACTION_PRIORITE_LABELS[action.priorite]}</Badge>
        <Badge variant="secondary">{ACTION_TYPE_LABELS[action.type]}</Badge>
        {action.cotation && action.cotation !== "non_evalue" ? (
          <span className={`${BADGE_BASE} ${COTATION_BADGE_CLASS[action.cotation] ?? "bg-muted"}`}>
            {COTATION_LABELS[action.cotation as keyof typeof COTATION_LABELS]}
          </span>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail de l'action</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Origine" value={ACTION_ORIGINE_LABELS[action.origine]} />
          <Field label="Processus concerné" value={processusNom} />
          <Field label="Échéance" value={formatDate(action.date_prevue)} />
          <Field label="Date effective" value={formatDate(action.date_effective)} />
          <Field label="Indicateur d'efficacité" value={action.indicateur_efficacite} />
          <div className="sm:col-span-2">
            <Field label="Constat" value={action.constat} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Cause fondamentale" value={action.cause_fondamentale} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Détail / action à mener" value={action.description_detail} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Recommandation" value={action.recommandation} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Commentaires" value={action.commentaires} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
