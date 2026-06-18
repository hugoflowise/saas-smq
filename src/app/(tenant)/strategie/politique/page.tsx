import type { JSONContent } from "@tiptap/react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { PolitiqueClient } from "./politique-client";
import { VersionHistory } from "./version-history";

export default async function PolitiquePage() {
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

  const { data: politique } = await supabase
    .from("politique_qualite")
    .select("contenu, statut")
    .eq("tenant_id", tid)
    .maybeSingle();

  const { data: rawVersions } = await supabase
    .from("politique_qualite_versions")
    .select("id, version, approved_at, approved_by, contenu_snapshot, created_at")
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });

  // Noms des approbateurs
  const approverIds = [...new Set((rawVersions ?? []).map((v) => v.approved_by).filter(Boolean))];
  const { data: approvers } = approverIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", approverIds as string[])
    : { data: [] };
  const nameById = new Map((approvers ?? []).map((p) => [p.id, p.full_name ?? p.email]));

  const versions = (rawVersions ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    approvedAt: v.approved_at,
    approverName: v.approved_by ? (nameById.get(v.approved_by) ?? null) : null,
    snapshot: (v.contenu_snapshot ?? null) as JSONContent | null,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Politique qualité"
        description="Document maîtrisé définissant les engagements qualité de la direction."
      />
      <PolitiqueClient
        initialContenu={(politique?.contenu ?? null) as JSONContent | null}
        statut={politique?.statut ?? "brouillon"}
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Historique des versions</CardTitle>
        </CardHeader>
        <CardContent>
          <VersionHistory versions={versions} />
        </CardContent>
      </Card>
    </div>
  );
}
