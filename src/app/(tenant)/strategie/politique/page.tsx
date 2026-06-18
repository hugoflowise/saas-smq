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
    .select("contenu, statut, version_actuelle_id")
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

  const current = versions.find((v) => v.id === politique?.version_actuelle_id) ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Politique qualité"
        description="Document maîtrisé définissant les engagements qualité de la direction."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <PolitiqueClient
            initialContenu={(politique?.contenu ?? null) as JSONContent | null}
            statut={politique?.statut ?? "brouillon"}
            currentVersion={current?.version ?? null}
            currentVersionDate={current?.approvedAt ?? null}
          />
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
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
