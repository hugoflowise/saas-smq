import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ContexteForm } from "./contexte-form";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export default async function ContextePage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Contexte de l'organisme"
          description="Analyse SWOT et PESTEL de l'organisme."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour renseigner son contexte."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: contexte } = await supabase
    .from("contexte_organisme")
    .select("analyse_swot, analyse_pestel, date_revue, prochain_revue")
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  const swotRaw = (contexte?.analyse_swot ?? {}) as Record<string, unknown>;
  const pestelRaw = (contexte?.analyse_pestel ?? {}) as Record<string, unknown>;

  return (
    <div className="w-full">
      <PageHeader
        title="Contexte de l'organisme"
        description="Analyse SWOT et PESTEL de l'organisme."
        isoClause="ISO 9001 §4.1"
        help="Déterminez les enjeux internes et externes pertinents pour votre SMQ et leur incidence sur les résultats attendus. Le SWOT/PESTEL est revu en revue de direction."
      />
      <ContexteForm
        initialSwot={{
          forces: str(swotRaw.forces),
          faiblesses: str(swotRaw.faiblesses),
          opportunites: str(swotRaw.opportunites),
          menaces: str(swotRaw.menaces),
        }}
        initialPestel={{
          politique: str(pestelRaw.politique),
          economique: str(pestelRaw.economique),
          sociologique: str(pestelRaw.sociologique),
          technologique: str(pestelRaw.technologique),
          ecologique: str(pestelRaw.ecologique),
          legal: str(pestelRaw.legal),
        }}
        initialDateRevue={contexte?.date_revue ?? ""}
        initialProchainRevue={contexte?.prochain_revue ?? ""}
      />
    </div>
  );
}
