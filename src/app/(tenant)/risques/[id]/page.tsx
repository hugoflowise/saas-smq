import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProcessusLink } from "@/components/processus-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate } from "@/lib/format";
import type { ACTION_STATUT_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { RoDialog } from "../ro-dialog";
import { RoActions } from "./ro-actions";

const TYPE_LABELS: Record<string, string> = { risque: "Risque", opportunite: "Opportunité" };
const STATUT_LABELS: Record<string, string> = {
  identifie: "Identifié",
  en_traitement: "En traitement",
  maitrise: "Maîtrisé",
  cloture: "Clôturé",
};

function criticiteClass(c: number) {
  if (c > 15) return "bg-status-nc-majeure/15 text-status-nc-majeure";
  if (c >= 9) return "bg-status-pa/15 text-status-pa";
  return "bg-status-conforme/15 text-status-conforme";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value || "-"}</span>
    </div>
  );
}

export default async function RoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/risques");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: ro } = await supabase
    .from("risques_opportunites")
    .select(
      "id, intitule, type, processus_id, cause, consequence, gravite, probabilite, criticite, gravite_residuelle, probabilite_residuelle, criticite_residuelle, traitement_prevu, statut, date_revue",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .maybeSingle();

  if (!ro) notFound();

  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", tid)
    .order("ordre_affichage", { ascending: true });
  const processusNom = (processus ?? []).find((p) => p.id === ro.processus_id)?.nom ?? null;

  const { data: links } = await supabase
    .from("ro_actions")
    .select("action_id")
    .eq("ro_id", id)
    .eq("tenant_id", tid);
  const actionIds = (links ?? []).map((l) => l.action_id);

  const { data: linkedActions } = actionIds.length
    ? await supabase
        .from("actions")
        .select("id, reference, description_courte, statut")
        .in("id", actionIds)
    : { data: [] };

  const criticite = ro.criticite ?? ro.gravite * ro.probabilite;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/risques"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Risques & Opportunités
      </Link>

      <PageHeader title={ro.intitule} description={TYPE_LABELS[ro.type] ?? ro.type}>
        <RoDialog processusOptions={processus ?? []} ro={ro} />
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-5 pt-6 sm:grid-cols-3">
          <Field label="Type" value={TYPE_LABELS[ro.type] ?? ro.type} />
          <Field label="Statut" value={STATUT_LABELS[ro.statut] ?? ro.statut} />
          <Field
            label="Processus"
            value={<ProcessusLink id={ro.processus_id} nom={processusNom} />}
          />
          <Field label="Gravité × Probabilité" value={`${ro.gravite} × ${ro.probabilite}`} />
          <Field
            label="Criticité brute"
            value={
              <span className={`${BADGE_BASE} ${criticiteClass(criticite)}`}>{criticite}</span>
            }
          />
          <Field
            label="Criticité résiduelle (après traitement)"
            value={
              ro.criticite_residuelle != null ? (
                <span className={`${BADGE_BASE} ${criticiteClass(ro.criticite_residuelle)}`}>
                  {ro.gravite_residuelle} × {ro.probabilite_residuelle} = {ro.criticite_residuelle}
                </span>
              ) : (
                "Non évaluée"
              )
            }
          />
          <Field label="Date de revue" value={formatDate(ro.date_revue)} />
          <div className="col-span-2 sm:col-span-3">
            <Field label="Cause" value={ro.cause} />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <Field label="Conséquence" value={ro.consequence} />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <Field label="Traitement prévu" value={ro.traitement_prevu} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          <RoActions
            roId={ro.id}
            linked={(linkedActions ?? []).map((a) => ({
              id: a.id,
              reference: a.reference,
              description_courte: a.description_courte,
              statut: a.statut as keyof typeof ACTION_STATUT_LABELS,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
