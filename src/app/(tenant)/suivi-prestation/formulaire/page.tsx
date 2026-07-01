import { redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { resoudreDefinitionFormulaire } from "@/lib/formulaire-modeles";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { FormulaireEditor } from "../../suivi-consultant/formulaire/formulaire-editor";

export const metadata = { title: "Personnaliser le formulaire" };

export default async function FormulairePrestationPage() {
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
  if (ctx.role === "auditeur") redirect("/suivi-prestation");

  const supabase = await createClient();
  const { sections, version } = await resoudreDefinitionFormulaire(
    supabase,
    ctx.effectiveTenantId,
    "suivi_prestation",
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/suivi-prestation" label="Suivi de prestation" />
      <PageHeader
        title="Personnaliser le formulaire « Suivi de prestation »"
        description="Adaptez les questions à votre organisation. Les questions essentielles (🔒) alimentent vos indicateurs : vous pouvez les reformuler et les réordonner, mais pas les supprimer."
      >
        <span className="text-muted-foreground text-sm">
          {version ? `Version personnalisée n°${version}` : "Modèle standard"}
        </span>
      </PageHeader>
      <FormulaireEditor
        type="suivi_prestation"
        initialSections={sections}
        personnalise={version != null}
      />
    </div>
  );
}
