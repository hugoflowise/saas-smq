import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ACTION_STATUT_LABELS, AUDIT_TYPE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { listTenantMembers } from "@/lib/tenant-users";
import { AuditActions } from "./audit-actions";
import { AuditEditForm } from "./audit-edit-form";
import { AuditGrille } from "./audit-grille";

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/audits");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: audit } = await supabase
    .from("audits_internes")
    .select(
      "id, reference, type_audit, organisme, perimetre, processus_audites, auditeur_id, date_prevue, date_realisee, duree_prevue, statut, rapport, ecarts_constates",
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

  // Membres du client : sélecteur d'auditeur + résolution du nom affiché.
  const auditeurs = await listTenantMembers(tid);
  const auditeurNom = audit.auditeur_id
    ? (auditeurs.find((u) => u.id === audit.auditeur_id)?.nom ?? null)
    : null;

  const { data: questions } = await supabase
    .from("audit_questions")
    .select("id, reference_iso, question, reponse, constat")
    .eq("audit_id", id)
    .eq("tenant_id", tid)
    .order("ordre", { ascending: true });

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
      <BackLink href="/audits" label="Audits" />

      <PageHeader
        title={`Audit ${audit.reference}`}
        description={`Audit ${AUDIT_TYPE_LABELS[audit.type_audit as keyof typeof AUDIT_TYPE_LABELS]?.toLowerCase() ?? ""}${
          audit.organisme ? ` · ${audit.organisme}` : ""
        }${auditeurNom ? ` · Auditeur : ${auditeurNom}` : ""}`}
      >
        <DownloadPdfButton printHref={`/print/audit/${id}`} label="Rapport d'audit (PDF)" />
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <AuditEditForm audit={audit} processusOptions={processus ?? []} auditeurs={auditeurs} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Grille d'audit</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditGrille auditId={audit.id} questions={questions ?? []} />
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
