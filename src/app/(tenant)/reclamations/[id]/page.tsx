import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOMAINE_SSE_LABELS, type DomaineSse } from "@/lib/domaines-sse";
import { formatDate } from "@/lib/format";
import {
  ACTION_STATUT_LABELS,
  NC_GRAVITE_LABELS,
  RECLAMATION_STATUT_LABELS,
  REMONTEE_TYPE_LABELS,
} from "@/lib/labels";
import { getNormesActives } from "@/lib/normes-actives";
import type { AnalyseMethode } from "@/lib/remontee-analyse";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ReclamationDialog } from "../reclamation-dialog";
import { RemonteeAnalyse } from "./remontee-analyse";

export default async function RemonteeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/reclamations");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;
  const afficherSse = (await getNormesActives()).includes("MASE");

  const { data: r } = await supabase
    .from("reclamations")
    .select(
      "id, type, objet, client, declarant_email, declarant_role, date_reception, canal, gravite, description, traitement, statut, domaine, analyse_methode, analyse_details, analyse_causes, avec_arret, jours_arret, action_id",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .maybeSingle();

  if (!r) notFound();

  const { data: action } = r.action_id
    ? await supabase
        .from("actions")
        .select("id, reference, description_courte, statut")
        .eq("id", r.action_id)
        .eq("tenant_id", tid)
        .maybeSingle()
    : { data: null };

  const details = (r.analyse_details ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/reclamations" label="Remontées" />

      <PageHeader
        title={r.objet}
        description={`${REMONTEE_TYPE_LABELS[r.type as keyof typeof REMONTEE_TYPE_LABELS] ?? r.type} · ${
          RECLAMATION_STATUT_LABELS[r.statut as keyof typeof RECLAMATION_STATUT_LABELS] ?? r.statut
        }`}
      >
        <ReclamationDialog reclamation={r} afficherSse={afficherSse} />
      </PageHeader>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Info
              label="Type"
              value={REMONTEE_TYPE_LABELS[r.type as keyof typeof REMONTEE_TYPE_LABELS] ?? r.type}
            />
            {afficherSse ? (
              <Info
                label="Domaine"
                value={r.domaine ? DOMAINE_SSE_LABELS[r.domaine as DomaineSse] : "-"}
              />
            ) : null}
            <Info
              label="Gravité"
              value={NC_GRAVITE_LABELS[r.gravite as keyof typeof NC_GRAVITE_LABELS] ?? r.gravite}
            />
            <Info label="Reçue le" value={formatDate(r.date_reception)} />
            <Info label="Client" value={r.client ?? "-"} />
            {afficherSse && r.avec_arret ? (
              <Info
                label="Accident avec arrêt"
                value={r.jours_arret != null ? `${r.jours_arret} j` : "Oui"}
              />
            ) : null}
            <div className="col-span-full">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Description
              </p>
              <p className="mt-1 whitespace-pre-wrap">{r.description?.trim() || "-"}</p>
            </div>
            <div className="col-span-full">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Traitement / réponse
              </p>
              <p className="mt-1 whitespace-pre-wrap">{r.traitement?.trim() || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action liée</CardTitle>
          </CardHeader>
          <CardContent>
            {action ? (
              <Link
                href={`/actions/${action.id}`}
                className="flex items-center justify-between gap-3 text-sm hover:text-primary"
              >
                <span className="min-w-0 truncate">
                  <span className="font-mono text-muted-foreground text-xs">
                    {action.reference}
                  </span>{" "}
                  {action.description_courte}
                </span>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {ACTION_STATUT_LABELS[action.statut as keyof typeof ACTION_STATUT_LABELS] ??
                    action.statut}
                </Badge>
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">
                Aucune action rattachée à cette remontée.
              </p>
            )}
          </CardContent>
        </Card>

        {afficherSse ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analyse des causes</CardTitle>
              <p className="mt-1 text-muted-foreground text-xs">
                Analysez les causes profondes de l'événement en vous appuyant sur une méthode. Cette
                étape se fait après la déclaration, une fois les faits recueillis.
              </p>
            </CardHeader>
            <CardContent>
              <RemonteeAnalyse
                reclamationId={r.id}
                initialMethode={(r.analyse_methode as AnalyseMethode | null) ?? null}
                initialDetails={details}
                initialCauses={r.analyse_causes ?? ""}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
