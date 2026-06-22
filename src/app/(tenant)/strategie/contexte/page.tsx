import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ContexteForm } from "./contexte-form";

/**
 * Convertit une case SWOT/PESTEL en liste de points.
 * Rétrocompatible avec l'ancien format texte libre (découpé par ligne).
 */
function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string")
    return v
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
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
          forces: toList(swotRaw.forces),
          faiblesses: toList(swotRaw.faiblesses),
          opportunites: toList(swotRaw.opportunites),
          menaces: toList(swotRaw.menaces),
        }}
        initialPestel={{
          politique: toList(pestelRaw.politique),
          economique: toList(pestelRaw.economique),
          sociologique: toList(pestelRaw.sociologique),
          technologique: toList(pestelRaw.technologique),
          ecologique: toList(pestelRaw.ecologique),
          legal: toList(pestelRaw.legal),
        }}
        initialDateRevue={contexte?.date_revue ?? ""}
        initialProchainRevue={contexte?.prochain_revue ?? ""}
      />
    </div>
  );
}
