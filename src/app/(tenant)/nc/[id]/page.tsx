import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { ProcessusLink } from "@/components/processus-link";
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
  searchParams: Promise<{ from?: string; tab?: string }>;
}) {
  const { id } = await params;
  const { from, tab } = await searchParams;
  // Onglet actif piloté par l'URL (ex. lien « Voir les actions liées » → ?tab=actions).
  const ongletActif = tab === "actions" || tab === "causes" ? tab : "details";
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
    .is("deleted_at", null)
    .order("ordre_affichage", { ascending: true });
  const processusNom = nc.processus_concerne
    ? ((processusOptions ?? []).find((p) => p.id === nc.processus_concerne)?.nom ?? null)
    : null;

  const { data: links } = await supabase
    .from("nc_actions")
    .select("action_id")
    .eq("nc_id", id)
    .eq("tenant_id", tid);
  const linkedIds = (links ?? []).map((l) => l.action_id);

  const { data: allActions } = await supabase
    .from("actions")
    .select(
      "id, reference, description_courte, statut, type, date_verification_efficacite, resultat_verification",
    )
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .order("reference", { ascending: true });

  const linked = (allActions ?? []).filter((a) => linkedIds.includes(a.id));
  const available = (allActions ?? [])
    .filter((a) => !linkedIds.includes(a.id))
    .map((a) => ({ id: a.id, reference: a.reference, description_courte: a.description_courte }));

  // §10.2 - état de la vérification d'efficacité des actions correctives liées.
  // Le verdict de clôture (efficace/inefficace) reste bloqué tant qu'une corrective
  // n'a pas sa date ET son résultat de vérification renseignés.
  const correctivesLiees = linked.filter((a) => a.type === "corrective");
  const correctivesNonVerifiees = correctivesLiees.filter(
    (a) => !a.date_verification_efficacite || !a.resultat_verification?.trim(),
  );
  const clotureBloquee = correctivesLiees.length > 0;
  const verdictBloque = correctivesNonVerifiees.length > 0;

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
      <BackLink href={backHref} label={backLabel} />

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

      <Tabs defaultValue={ongletActif}>
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
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Processus concerné
                </p>
                <p className="mt-1 text-sm">
                  <ProcessusLink id={nc.processus_concerne} nom={processusNom} />
                </p>
              </div>
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
            <CardContent className="flex flex-col gap-4">
              {/* §10.2 - explication du verrou de clôture si une corrective est liée. */}
              {clotureBloquee ? (
                <p
                  className={`rounded-md border px-3 py-2 text-sm ${
                    verdictBloque
                      ? "border-status-nc-mineure/40 bg-status-nc-mineure/10 text-status-nc-mineure"
                      : "border-status-conforme/40 bg-status-conforme/10 text-status-conforme"
                  }`}
                >
                  {verdictBloque
                    ? "Clôture bloquée : renseignez la date ET le résultat de vérification d'efficacité de chaque action corrective, puis clôturez la NC avec un verdict Efficace ou Inefficace."
                    : "Efficacité vérifiée : vous pouvez clôturer cette NC avec un verdict Efficace ou Inefficace (le statut « Clôturée » seul est refusé)."}
                </p>
              ) : null}
              <NcActionsLink ncId={nc.id} linked={linked} available={available} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
