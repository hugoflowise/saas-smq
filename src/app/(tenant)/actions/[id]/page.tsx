import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { COTATION_LABELS } from "@/app/(tenant)/conformite/cotation-meta";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { ProcessusLink } from "@/components/processus-link";
import { SupprimerButton } from "@/components/supprimer-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteActionAction } from "@/lib/actions/plan-actions";
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
      <p className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() ? value : "-"}</p>
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
      "id, reference, description_courte, description_detail, origine, type, priorite, statut, processus_concerne, objectif_id, date_prevue, date_effective, indicateur_efficacite, resultat_efficacite, date_verification_efficacite, resultat_verification, commentaires, constat, cause_fondamentale, recommandation, cotation",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!action) notFound();

  const [{ data: processusOptions }, { data: objectifOptions }] = await Promise.all([
    supabase
      .from("processus")
      .select("id, nom")
      .eq("tenant_id", tid)
      .order("ordre_affichage", { ascending: true }),
    supabase
      .from("objectifs_qualite")
      .select("id, intitule")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);

  const processusNom = action.processus_concerne
    ? ((processusOptions ?? []).find((p) => p.id === action.processus_concerne)?.nom ?? "-")
    : "-";

  // §6.2.2 : objectif qualité auquel cette action contribue (lien direct).
  const objectifLie = action.objectif_id
    ? ((objectifOptions ?? []).find((o) => o.id === action.objectif_id) ?? null)
    : null;

  // Non-conformité(s) liée(s) via la table pivot nc_actions → on permet de
  // remonter à la NC d'origine depuis la fiche action.
  const { data: ncLinks } = await supabase
    .from("nc_actions")
    .select("nc_id")
    .eq("action_id", id)
    .eq("tenant_id", tid);

  const ncIds = (ncLinks ?? []).map((l) => l.nc_id);
  const { data: ncLiees } = ncIds.length
    ? await supabase
        .from("non_conformites")
        .select("id, reference, intitule")
        .in("id", ncIds)
        .eq("tenant_id", tid)
        .is("deleted_at", null)
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/actions" label="Plan d'actions" />

      <PageHeader title={action.description_courte}>
        <ActionDialog
          processusOptions={processusOptions ?? []}
          objectifOptions={objectifOptions ?? []}
          action={action}
        />
        <SupprimerButton
          action={deleteActionAction}
          id={action.id}
          libelle="cette action"
          redirectTo="/actions"
        />
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

      {(ncLiees ?? []).length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Non-conformité liée</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(ncLiees ?? []).map((nc) => (
              <Link
                key={nc.id}
                href={`/nc/${nc.id}`}
                className="text-sm hover:text-primary hover:underline"
              >
                <span className="font-mono text-muted-foreground text-xs">{nc.reference}</span>{" "}
                {nc.intitule}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail de l'action</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Origine" value={ACTION_ORIGINE_LABELS[action.origine]} />
          <div>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Processus concerné
            </p>
            <p className="mt-1 text-sm">
              <ProcessusLink
                id={action.processus_concerne}
                nom={action.processus_concerne ? processusNom : null}
              />
            </p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Objectif lié
            </p>
            <p className="mt-1 text-sm">
              {objectifLie ? (
                <Link href="/strategie/objectifs" className="text-primary hover:underline">
                  {objectifLie.intitule}
                </Link>
              ) : (
                "-"
              )}
            </p>
          </div>
          <Field
            label="Cotation"
            value={
              action.cotation
                ? COTATION_LABELS[action.cotation as keyof typeof COTATION_LABELS]
                : null
            }
          />
          <Field label="Échéance" value={formatDate(action.date_prevue)} />
          <Field label="Date effective" value={formatDate(action.date_effective)} />
          <Field label="Indicateur d'efficacité" value={action.indicateur_efficacite} />
          <Field
            label="Vérification d'efficacité (date)"
            value={formatDate(action.date_verification_efficacite)}
          />
          <div className="sm:col-span-2">
            <Field
              label="Résultat de la vérification d'efficacité"
              value={action.resultat_verification}
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Résultats mesurés / Efficacité de l'action corrective"
              value={action.resultat_efficacite}
            />
          </div>
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
