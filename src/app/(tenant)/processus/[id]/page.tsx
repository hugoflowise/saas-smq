import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { EditProcessusDialog } from "./edit-processus-dialog";

const TYPE_LABELS: Record<string, string> = {
  pilotage: "Pilotage",
  realisation: "Réalisation",
  support: "Support",
};

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

type RelatedItem = { id: string; href: string; primary: string; secondary?: string };

function RelatedList({ items, empty }: { items: RelatedItem[]; empty: string }) {
  if (items.length === 0) {
    return <EmptyState title="Rien à afficher" description={empty} />;
  }
  return (
    <Card>
      <CardContent className="py-2">
        <ul className="flex flex-col divide-y">
          {items.map((it) => (
            <li key={it.id} className="py-2.5">
              <Link
                href={it.href}
                className="flex items-center justify-between gap-3 text-sm hover:text-primary"
              >
                <span className="min-w-0 truncate font-medium">{it.primary}</span>
                {it.secondary ? (
                  <span className="shrink-0 text-muted-foreground text-xs">{it.secondary}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default async function ProcessusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/processus");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom, type, description, entrees, sorties, ressources_associees")
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!processus) notFound();

  const [procedures, indicateurs, risques, ncs] = await Promise.all([
    supabase
      .from("procedures")
      .select("id, titre, statut")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("titre"),
    supabase
      .from("indicateurs")
      .select("id, nom, unite")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("nom"),
    supabase
      .from("risques_opportunites")
      .select("id, intitule, criticite, type")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("criticite", { ascending: false }),
    supabase
      .from("non_conformites")
      .select("id, reference, intitule, statut")
      .eq("tenant_id", tid)
      .eq("processus_concerne", id)
      .order("date_constat", { ascending: false }),
  ]);

  const procItems: RelatedItem[] = (procedures.data ?? []).map((p) => ({
    id: p.id,
    href: `/documentation/procedures/${p.id}`,
    primary: p.titre,
    secondary: p.statut,
  }));
  const indItems: RelatedItem[] = (indicateurs.data ?? []).map((i) => ({
    id: i.id,
    href: `/indicateurs/${i.id}`,
    primary: i.nom,
    secondary: i.unite ?? undefined,
  }));
  const roItems: RelatedItem[] = (risques.data ?? []).map((r) => ({
    id: r.id,
    href: "/risques",
    primary: r.intitule,
    secondary: `${r.type === "risque" ? "Risque" : "Opportunité"} · criticité ${r.criticite}`,
  }));
  const ncItems: RelatedItem[] = (ncs.data ?? []).map((n) => ({
    id: n.id,
    href: `/nc/${n.id}`,
    primary: `${n.reference} — ${n.intitule}`,
    secondary: n.statut,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/processus"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Cartographie
      </Link>

      <PageHeader title={processus.nom}>
        <EditProcessusDialog processus={processus} />
      </PageHeader>
      <Badge variant="secondary" className="mb-6">
        {TYPE_LABELS[processus.type] ?? processus.type}
      </Badge>

      <Tabs defaultValue="fiche">
        <TabsList>
          <TabsTrigger value="fiche">Fiche d'identité</TabsTrigger>
          <TabsTrigger value="procedures">Procédures ({procItems.length})</TabsTrigger>
          <TabsTrigger value="indicateurs">Indicateurs ({indItems.length})</TabsTrigger>
          <TabsTrigger value="risques">R&O ({roItems.length})</TabsTrigger>
          <TabsTrigger value="nc">NC liées ({ncItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="fiche">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fiche d'identité</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Description" value={processus.description} />
              <Field label="Entrées" value={processus.entrees} />
              <Field label="Sorties" value={processus.sorties} />
              <Field label="Ressources associées" value={processus.ressources_associees} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedures">
          <RelatedList
            items={procItems}
            empty="Aucune procédure rattachée à ce processus. Associez-en une depuis le module Procédures."
          />
        </TabsContent>
        <TabsContent value="indicateurs">
          <RelatedList
            items={indItems}
            empty="Aucun indicateur rattaché. Associez un processus lors de la création d'un indicateur."
          />
        </TabsContent>
        <TabsContent value="risques">
          <RelatedList
            items={roItems}
            empty="Aucun risque ni opportunité rattaché à ce processus."
          />
        </TabsContent>
        <TabsContent value="nc">
          <RelatedList items={ncItems} empty="Aucune non-conformité rattachée à ce processus." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
