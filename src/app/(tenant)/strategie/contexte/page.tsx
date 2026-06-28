import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { formatDate, nomPersonne } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ContexteForm } from "./contexte-form";
import { ContexteReference } from "./contexte-reference";
import type { ContexteSnapshot } from "./contexte-snapshot";
import { ContexteVersionHistory, type ContexteVersionItem } from "./contexte-version-history";
import { PublierContexteButton } from "./publier-contexte-button";

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
    .select("analyse_swot, analyse_pestel, date_revue, prochain_revue, reference")
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  // Historique des versions figées (la plus récente = courante).
  const { data: rawVersions } = await supabase
    .from("contexte_versions")
    .select("id, version, created_at, published_by, snapshot")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("created_at", { ascending: false });

  const publisherIds = [
    ...new Set((rawVersions ?? []).map((v) => v.published_by).filter((id): id is string => !!id)),
  ];
  const { data: publishers } = publisherIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", publisherIds)
    : { data: [] };
  const nameById = new Map(
    (publishers ?? []).map((p) => [p.id, nomPersonne(p.full_name, p.email)]),
  );

  const versions: ContexteVersionItem[] = (rawVersions ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    publishedAt: v.created_at,
    publisher: v.published_by ? (nameById.get(v.published_by) ?? null) : null,
    snapshot: v.snapshot as unknown as ContexteSnapshot | null,
  }));
  const current = versions[0] ?? null;

  const swotRaw = (contexte?.analyse_swot ?? {}) as Record<string, unknown>;
  const pestelRaw = (contexte?.analyse_pestel ?? {}) as Record<string, unknown>;

  return (
    <div className="w-full">
      <PageHeader
        title="Contexte de l'organisme"
        description="Analyse SWOT et PESTEL de l'organisme."
        isoClause="ISO 9001 §4.1"
        help="Déterminez les enjeux internes et externes pertinents pour votre SMQ et leur incidence sur les résultats attendus. Le SWOT/PESTEL est revu en revue de direction."
      >
        <PublierContexteButton />
      </PageHeader>

      {/* Référence documentaire + version courante + date de mise à jour. */}
      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
        <ContexteReference initial={contexte?.reference ?? null} />
        {current ? (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span>
              Version <span className="font-medium text-foreground">{current.version}</span> · figée
              le {formatDate(current.publishedAt)}
              {current.publisher ? ` par ${current.publisher}` : ""}
            </span>
          </>
        ) : (
          <span>
            <span className="text-muted-foreground/50">·</span> Aucune version figée. Utilisez «
            Publier une version » pour archiver l'état actuel.
          </span>
        )}
      </div>

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

      {/* Historique des versions figées (consultables en lecture seule). */}
      <details className="group mt-8 rounded-lg border bg-surface text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground">
          <span className="font-medium">Historique des versions ({versions.length})</span>
          <span className="ml-auto text-xs group-open:hidden">Afficher</span>
          <span className="ml-auto hidden text-xs group-open:inline">Masquer</span>
        </summary>
        <div className="border-t p-3">
          <ContexteVersionHistory versions={versions} />
        </div>
      </details>
    </div>
  );
}
