import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NC_GRAVITE_LABELS,
  NC_ORIGINE_LABELS,
  NC_STATUT_LABELS,
  NC_TYPE_LABELS,
} from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { NcDialog } from "../nc-dialog";
import { NcActionsLink } from "./nc-actions-link";
import { NcCauses } from "./nc-causes";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() ? value : "-"}</p>
    </div>
  );
}

export default async function NcDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from?.startsWith("/") ? from : "/nc";
  const backLabel = from?.startsWith("/processus") ? "Retour au processus" : "Non-conformités";
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/nc");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: nc } = await supabase
    .from("non_conformites")
    .select(
      "id, reference, intitule, description, date_constat, origine, gravite, type, statut, processus_concerne, causes_identifiees",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!nc) notFound();

  const { data: processusOptions } = await supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", tid)
    .order("ordre_affichage", { ascending: true });

  const { data: links } = await supabase
    .from("nc_actions")
    .select("action_id")
    .eq("nc_id", id)
    .eq("tenant_id", tid);
  const linkedIds = (links ?? []).map((l) => l.action_id);

  const { data: allActions } = await supabase
    .from("actions")
    .select("id, reference, description_courte, statut")
    .eq("tenant_id", tid)
    .order("reference", { ascending: true });

  const linked = (allActions ?? []).filter((a) => linkedIds.includes(a.id));
  const available = (allActions ?? [])
    .filter((a) => !linkedIds.includes(a.id))
    .map((a) => ({ id: a.id, reference: a.reference, description_courte: a.description_courte }));

  const rawCauses = (nc.causes_identifiees ?? {}) as {
    probleme?: string;
    pourquoi?: string[];
    cause_racine?: string;
  };
  const causesInitial = {
    probleme: rawCauses.probleme ?? "",
    pourquoi: Array.isArray(rawCauses.pourquoi) ? rawCauses.pourquoi : [],
    causeRacine: rawCauses.cause_racine ?? "",
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <PageHeader title={`${nc.reference} · ${nc.intitule}`}>
        <NcDialog
          processusOptions={processusOptions ?? []}
          nc={{
            id: nc.id,
            intitule: nc.intitule,
            description: nc.description,
            date_constat: nc.date_constat,
            origine: nc.origine,
            gravite: nc.gravite,
            type: nc.type,
            statut: nc.statut,
            processus_concerne: nc.processus_concerne,
          }}
        />
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="secondary">{NC_GRAVITE_LABELS[nc.gravite]}</Badge>
        <Badge variant="secondary">{NC_STATUT_LABELS[nc.statut]}</Badge>
        <Badge variant="secondary">{NC_TYPE_LABELS[nc.type]}</Badge>
        <Badge variant="secondary">Origine : {NC_ORIGINE_LABELS[nc.origine]}</Badge>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="causes">Analyse des causes</TabsTrigger>
          <TabsTrigger value="actions">Actions correctives</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-2">
              <Field label="Description" value={nc.description} />
              <Field label="Date de constat" value={nc.date_constat} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="causes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analyse des causes · 5 pourquoi</CardTitle>
            </CardHeader>
            <CardContent>
              <NcCauses ncId={nc.id} initial={causesInitial} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions correctives</CardTitle>
            </CardHeader>
            <CardContent>
              <NcActionsLink ncId={nc.id} linked={linked} available={available} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
