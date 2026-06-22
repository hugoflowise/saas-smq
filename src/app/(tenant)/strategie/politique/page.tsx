import type { JSONContent } from "@tiptap/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Societe } from "@/components/document-paper";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { PolitiqueClient } from "./politique-client";
import { VersionHistory } from "./version-history";

export default async function PolitiquePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const retourDocuments = from === "/documents";
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Politique qualité"
          description="Document maîtrisé définissant les engagements qualité de la direction."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer sa politique qualité."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales",
    )
    .eq("id", tid)
    .maybeSingle();

  const { data: politique } = await supabase
    .from("politique_qualite")
    .select("contenu, statut, version_actuelle_id, created_by, approved_by, approved_at")
    .eq("tenant_id", tid)
    .maybeSingle();

  const { data: rawVersions } = await supabase
    .from("politique_qualite_versions")
    .select("id, version, approved_at, approved_by, contenu_snapshot, created_at")
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });

  // Noms des intervenants (rédacteur + approbateurs)
  const personIds = [
    ...new Set(
      [
        politique?.created_by,
        politique?.approved_by,
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
  }));

  const current = versions.find((v) => v.id === politique?.version_actuelle_id) ?? null;

  const isApprover = ctx.role === "admin_flowise" || ctx.role === "dirigeant";
  const canWrite = isApprover || ctx.role === "manager";
  const drafterName = politique?.created_by ? (nameById.get(politique.created_by) ?? null) : null;
  const approverName = politique?.approved_by
    ? (nameById.get(politique.approved_by) ?? null)
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {retourDocuments ? (
        <Link
          href="/documents"
          className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour aux documents
        </Link>
      ) : null}

      <PageHeader
        title="Politique qualité"
        description="Document maîtrisé définissant les engagements qualité de la direction."
        isoClause="ISO 9001 §5.2"
        help="La direction établit et tient à jour une politique qualité adaptée à la finalité de l'organisme. Elle sert de cadre aux objectifs qualité, est communiquée à tous et tenue à disposition des parties intéressées."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <PolitiqueClient
            initialContenu={(politique?.contenu ?? null) as JSONContent | null}
            statut={politique?.statut ?? "brouillon"}
            currentVersion={current?.version ?? null}
            currentVersionDate={current?.approvedAt ?? null}
            publishedCount={versions.length}
            canWrite={canWrite}
            canApprove={isApprover}
            drafterName={drafterName}
            approverName={approverName}
            approvedAt={politique?.approved_at ?? null}
            societe={tenant as Societe}
          />
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des versions</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <VersionHistory
                versions={versions}
                pending={
                  politique && politique.statut !== "publiee"
                    ? { version: `v${versions.length + 1}`, statut: politique.statut }
                    : null
                }
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
