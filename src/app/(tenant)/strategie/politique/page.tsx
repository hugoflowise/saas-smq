import type { JSONContent } from "@tiptap/react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { PolitiqueClient } from "./politique-client";

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
  const { data: politique } = await supabase
    .from("politique_qualite")
    .select("contenu, statut")
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

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
    </div>
  );
}
