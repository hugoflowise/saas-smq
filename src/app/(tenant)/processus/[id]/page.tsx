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

export default async function ProcessusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/processus");

  const supabase = await createClient();
  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom, type, description, entrees, sorties, ressources_associees")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  if (!processus) notFound();

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
          <TabsTrigger value="procedures">Procédures</TabsTrigger>
          <TabsTrigger value="indicateurs">Indicateurs</TabsTrigger>
          <TabsTrigger value="risques">R&O</TabsTrigger>
          <TabsTrigger value="nc">NC liées</TabsTrigger>
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
          <EmptyState
            title="Procédures"
            description="Le module Procédures arrivera dans une prochaine itération."
          />
        </TabsContent>
        <TabsContent value="indicateurs">
          <EmptyState
            title="Indicateurs"
            description="Le module Indicateurs arrivera dans une prochaine itération."
          />
        </TabsContent>
        <TabsContent value="risques">
          <EmptyState
            title="Risques & Opportunités"
            description="Le module R&O arrivera dans une prochaine itération."
          />
        </TabsContent>
        <TabsContent value="nc">
          <EmptyState
            title="Non-conformités"
            description="Le module NC arrivera dans une prochaine itération."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
