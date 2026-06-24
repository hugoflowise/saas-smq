import type { JSONContent } from "@tiptap/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { VersionHistory } from "@/app/(tenant)/strategie/politique/version-history";
import type { Societe } from "@/components/document-paper";
import { MaitriseDocument } from "@/components/maitrise-document";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  publishProcedureAction,
  saveProcedureContenuAction,
  transitionProcedureStatutAction,
} from "@/lib/actions/procedures";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
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
  const backLabel = from?.startsWith("/processus")
    ? "Retour au processus"
    : from === "/documents"
      ? "Retour aux documents"
      : "Procédures";
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/documentation/procedures");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const [{ data: procedure }, { data: tenant }] = await Promise.all([
    supabase
      .from("procedures")
      .select(
        "id, titre, contenu, statut, version_actuelle_id, created_by, approved_by, approved_at, redacteur, verificateur, note_revision, processus_id, reference_iso",
      )
      .eq("id", id)
      .eq("tenant_id", tid)
      .maybeSingle(),
    supabase
      .from("tenants")
      .select(
        "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, couleur_charte",
      )
      .eq("id", tid)
      .maybeSingle(),
  ]);

  if (!procedure) notFound();

  // Processus rattaché (affiché dans les métadonnées du document).
  const { data: processus } = procedure.processus_id
    ? await supabase.from("processus").select("nom").eq("id", procedure.processus_id).maybeSingle()
    : { data: null };

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

  const metaExtra = [
    ...(processus?.nom ? [{ label: "Processus", value: processus.nom }] : []),
    ...(procedure.reference_iso?.length
      ? [{ label: "Réf. ISO", value: procedure.reference_iso.join(", ") }]
      : []),
  ];

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
          <MaitriseDocument
            surtitre="Procédure"
            titre={procedure.titre}
            societe={tenant as Societe}
            metaExtra={metaExtra}
            initialContenu={(procedure.contenu ?? null) as JSONContent | null}
            statut={procedure.statut}
            currentVersion={current?.version ?? null}
            currentVersionDate={current?.approvedAt ?? null}
            publishedCount={versions.length}
            canWrite={canWrite}
            canApprove={isApprover}
            drafterName={procedure.created_by ? (nameById.get(procedure.created_by) ?? null) : null}
            approverName={
              procedure.approved_by ? (nameById.get(procedure.approved_by) ?? null) : null
            }
            approvedAt={procedure.approved_at}
            printHref={`/print/procedure/${procedure.id}`}
            labelDocument="procédure"
            signatureTitle="Approuver la procédure"
            signatureDescription="Signez avec votre mot de passe pour approuver ce document."
            onSaveContenu={saveProcedureContenuAction.bind(null, procedure.id)}
            onTransition={transitionProcedureStatutAction.bind(null, procedure.id)}
            onPublish={publishProcedureAction.bind(null, procedure.id)}
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
