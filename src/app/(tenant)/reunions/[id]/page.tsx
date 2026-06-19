import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ACTION_STATUT_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ReunionActions } from "./reunion-actions";
import { type Point, type ReunionDetail, ReunionEditForm } from "./reunion-edit-form";

export default async function ReunionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/reunions");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: reunion } = await supabase
    .from("reunions")
    .select(
      "id, titre, type, date_prevue, date_realisation, lieu, animateur, objectifs, convoques, presents, synthese, statut, points",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!reunion) notFound();

  const { data: links } = await supabase
    .from("reunion_actions")
    .select("action_id")
    .eq("reunion_id", id)
    .eq("tenant_id", tid);
  const actionIds = (links ?? []).map((l) => l.action_id);
  const { data: linkedActions } = actionIds.length
    ? await supabase
        .from("actions")
        .select("id, reference, description_courte, statut")
        .in("id", actionIds)
    : { data: [] };

  const detail: ReunionDetail = {
    ...reunion,
    points: (reunion.points ?? []) as Point[],
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/reunions"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Réunions QHSE
      </Link>

      <PageHeader title={reunion.titre} description="Préparation, tenue en séance et compte rendu.">
        <Button variant="outline" className="gap-2" render={<Link href={`/print/reunion/${id}`} />}>
          <FileText className="size-4" />
          Compte rendu (PDF)
        </Button>
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <ReunionEditForm reunion={detail} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions issues de la réunion</CardTitle>
        </CardHeader>
        <CardContent>
          <ReunionActions
            reunionId={id}
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
