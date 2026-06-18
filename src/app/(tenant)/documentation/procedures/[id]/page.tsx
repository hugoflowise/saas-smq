import type { JSONContent } from "@tiptap/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { VersionHistory } from "@/app/(tenant)/strategie/politique/version-history";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ProcedureClient } from "./procedure-client";
import { ProcedureRevisionForm } from "./procedure-revision-form";

export default async function ProcedureDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from?.startsWith("/") ? from : "/documentation/procedures";
  const backLabel = from?.startsWith("/processus") ? "Retour au processus" : "Procédures";
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/documentation/procedures");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: procedure } = await supabase
    .from("procedures")
    .select(
      "id, titre, contenu, statut, version_actuelle_id, created_by, approved_by, approved_at, redacteur, verificateur, note_revision",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!procedure) notFound();

  const { data: rawVersions } = await supabase
    .from("procedures_versions")
    .select(
      "id, version, approved_at, approved_by, contenu_snapshot, created_at, redacteur, verificateur, note_revision",
    )
    .eq("procedure_id", id)
    .order("created_at", { ascending: false });

  const personIds = [
    ...new Set(
      [
        procedure.created_by,
        procedure.approved_by,
        ...(rawVersions ?? []).map((v) => v.approved_by),
      ].filter(Boolean),
    ),
  ] as string[];
  const { data: persons } = personIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", personIds)
    : { data: [] };
  const nameById = new Map((persons ?? []).map((p) => [p.id, p.full_name ?? p.email]));

  const versions = (rawVersions ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    approvedAt: v.approved_at,
    approverName: v.approved_by ? (nameById.get(v.approved_by) ?? null) : null,
    snapshot: (v.contenu_snapshot ?? null) as JSONContent | null,
    redacteur: v.redacteur,
    verificateur: v.verificateur,
    noteRevision: v.note_revision,
  }));

  const current = versions.find((v) => v.id === procedure.version_actuelle_id) ?? null;
  const isApprover = ctx.role === "admin_flowise" || ctx.role === "dirigeant";
  const canWrite = isApprover || ctx.role === "manager";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <PageHeader title={procedure.titre} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <ProcedureClient
            id={procedure.id}
            initialContenu={(procedure.contenu ?? null) as JSONContent | null}
            statut={procedure.statut}
            currentVersion={current?.version ?? null}
            currentVersionDate={current?.approvedAt ?? null}
            canWrite={canWrite}
            canApprove={isApprover}
            drafterName={procedure.created_by ? (nameById.get(procedure.created_by) ?? null) : null}
            approverName={
              procedure.approved_by ? (nameById.get(procedure.approved_by) ?? null) : null
            }
            approvedAt={procedure.approved_at}
          />
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responsabilités &amp; révision</CardTitle>
            </CardHeader>
            <CardContent>
              <ProcedureRevisionForm
                id={procedure.id}
                redacteur={procedure.redacteur}
                verificateur={procedure.verificateur}
                noteRevision={procedure.note_revision}
                approverName={
                  procedure.approved_by ? (nameById.get(procedure.approved_by) ?? null) : null
                }
                canWrite={canWrite}
                editable={procedure.statut === "brouillon"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des versions</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <VersionHistory versions={versions} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
