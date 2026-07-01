import { redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { resoudreDefinitionFormulaire } from "@/lib/formulaire-modeles";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { FormulaireEditor } from "./formulaire-editor";

export const metadata = { title: "Personnaliser le formulaire" };

export default async function FormulaireConsultantPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Personnaliser le formulaire" />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  // L'auditeur (lecture seule) n'édite pas les formulaires.
  if (ctx.role === "auditeur") redirect("/suivi-consultant");

  const supabase = await createClient();
  const { sections, version } = await resoudreDefinitionFormulaire(
    supabase,
    ctx.effectiveTenantId,
    "suivi_consultant",
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/suivi-consultant" label="Suivi consultant" />
      <PageHeader
        title="Personnaliser le formulaire « Suivi consultant »"
        description="Adaptez les questions à votre organisation. Les questions essentielles (🔒) alimentent vos indicateurs : vous pouvez les reformuler et les réordonner, mais pas les supprimer."
        help="Vos modifications créent une nouvelle version du formulaire, appliquée aux prochaines réponses (les réponses déjà enregistrées ne changent pas). Ajoutez, renommez, réordonnez ou masquez des questions ; les questions verrouillées (🔒) restent car elles nourrissent la satisfaction, le NPS et les indicateurs. Le lien partagé aux consultants et le formulaire hors ligne reprennent automatiquement la dernière version."
      >
        <span className="text-muted-foreground text-sm">
          {version ? `Version personnalisée n°${version}` : "Modèle standard"}
        </span>
      </PageHeader>
      <FormulaireEditor
        type="suivi_consultant"
        initialSections={sections}
        personnalise={version != null}
      />
    </div>
  );
}
