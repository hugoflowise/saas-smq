import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { formatDate, nomPersonne } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { DomaineForm, type Exclusion } from "./domaine-form";
import type { DomaineSnapshot } from "./domaine-snapshot";
import { DomaineVersionHistory, type DomaineVersionItem } from "./domaine-version-history";
import { PublierDomaineButton } from "./publier-domaine-button";

export default async function DomainePage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Domaine d'application"
          description="Périmètre du SMQ et justification des exclusions."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour renseigner le domaine d'application."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;
  const { data: domaine } = await supabase
    .from("domaine_application")
    .select(
      "perimetre, sites, exclusions, date_etablissement, prochaine_revue, valide_par, valide_le",
    )
    .eq("tenant_id", tid)
    .maybeSingle();

  // Historique des versions figées (la plus récente = courante).
  const { data: rawVersions } = await supabase
    .from("domaine_versions")
    .select("id, version, created_at, published_by, snapshot")
    .eq("tenant_id", tid)
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

  const versions: DomaineVersionItem[] = (rawVersions ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    publishedAt: v.created_at,
    publisher: v.published_by ? (nameById.get(v.published_by) ?? null) : null,
    snapshot: v.snapshot as unknown as DomaineSnapshot | null,
  }));
  const current = versions[0] ?? null;

  // Nom du validateur (preuve d'approbation direction)
  let validateurNom: string | null = null;
  if (domaine?.valide_par) {
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", domaine.valide_par)
      .maybeSingle();
    validateurNom = p?.full_name ?? null;
  }

  const exclusionsRaw = Array.isArray(domaine?.exclusions) ? domaine.exclusions : [];
  const exclusions = (exclusionsRaw as Record<string, unknown>[]).map((e) => ({
    clause: typeof e.clause === "string" ? e.clause : "",
    intitule: typeof e.intitule === "string" ? e.intitule : "",
    justification: typeof e.justification === "string" ? e.justification : "",
  })) as Exclusion[];

  return (
    <div className="w-full">
      <PageHeader
        title="Domaine d'application"
        description="Périmètre du SMQ et justification des exclusions."
        isoClause="ISO 9001 §4.3"
        help="Décrivez le domaine d'application du SMQ (activités, produits/services, sites concernés) et justifiez les exigences non applicables. Cette information documentée est exigée et examinée en audit de certification."
      >
        <PublierDomaineButton />
      </PageHeader>

      {/* Version courante figée (le cas échéant). */}
      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
        {current ? (
          <span>
            Version <span className="font-medium text-foreground">{current.version}</span> · figée
            le {formatDate(current.publishedAt)}
            {current.publisher ? ` par ${current.publisher}` : ""}
          </span>
        ) : (
          <span>
            Aucune version figée. Utilisez « Publier une version » pour archiver l'état actuel.
          </span>
        )}
      </div>

      <DomaineForm
        exists={Boolean(domaine)}
        initial={{
          perimetre: domaine?.perimetre ?? "",
          sites: domaine?.sites ?? "",
          exclusions,
          dateEtablissement: domaine?.date_etablissement ?? "",
          prochaineRevue: domaine?.prochaine_revue ?? "",
        }}
        valideLe={domaine?.valide_le ?? null}
        validateurNom={validateurNom}
      />

      {/* Historique des versions figées (consultables en lecture seule). */}
      <details className="group mt-8 rounded-lg border bg-surface text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground">
          <span className="font-medium">Historique des versions ({versions.length})</span>
          <span className="ml-auto text-xs group-open:hidden">Afficher</span>
          <span className="ml-auto hidden text-xs group-open:inline">Masquer</span>
        </summary>
        <div className="border-t p-3">
          <DomaineVersionHistory versions={versions} />
        </div>
      </details>
    </div>
  );
}
