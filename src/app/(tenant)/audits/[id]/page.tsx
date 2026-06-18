import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ACTION_STATUT_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { AuditActions } from "./audit-actions";
import { AuditEditForm } from "./audit-edit-form";

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/audits");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: audit } = await supabase
    .from("audits_internes")
    .select(
      "id, reference, perimetre, processus_audites, date_prevue, date_realisee, duree_prevue, statut, rapport, ecarts_constates",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!audit) notFound();

  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", tid)
    .order("ordre_affichage", { ascending: true });

  const { data: links } = await supabase
    .from("audit_actions")
    .select("action_id")
    .eq("audit_id", id)
    .eq("tenant_id", tid);
  const actionIds = (links ?? []).map((l) => l.action_id);

  const { data: linkedActions } = actionIds.length
    ? await supabase
        .from("actions")
        .select("id, reference, description_courte, statut")
        .in("id", actionIds)
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/audits"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Audits internes
      </Link>

      <PageHeader title={`Audit ${audit.reference}`} description="Fiche d'audit interne." />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <AuditEditForm audit={audit} processusOptions={processus ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions correctives (écarts)</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditActions
            auditId={audit.id}
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
