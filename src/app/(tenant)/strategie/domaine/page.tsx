import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { DomaineForm, type Exclusion } from "./domaine-form";

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
  const { data: domaine } = await supabase
    .from("domaine_application")
    .select(
      "perimetre, sites, exclusions, date_etablissement, prochaine_revue, valide_par, valide_le",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

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
      />
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
    </div>
  );
}
