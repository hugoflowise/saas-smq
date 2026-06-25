import type { JSONContent } from "@tiptap/react";
import { PrintShell, type Societe } from "@/components/print-shell";
import { type ProcDef, ProcedureSections, type ProcRef } from "@/components/procedure-sections";
import { TiptapEditor } from "@/components/tiptap-editor";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

export default async function ProcedurePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return <p className="p-8 text-sm">Aucun client sélectionné.</p>;
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, couleur_charte",
    )
    .eq("id", tid)
    .maybeSingle();

  const { data: procedure } = await supabase
    .from("procedures")
    .select(
      "titre, contenu, version_actuelle_id, reference_iso, objet, domaine_application, resume, diffusion, glossaire_sigles, glossaire_symboles, glossaire_abreviations, definitions, references_doc, references_appli, logigramme_svg",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!procedure) {
    return <p className="p-8 text-sm">Procédure introuvable.</p>;
  }

  const { data: version } = procedure.version_actuelle_id
    ? await supabase
        .from("procedures_versions")
        .select(
          "version, approved_at, approved_by, contenu_snapshot, sections_snapshot, redacteur, verificateur",
        )
        .eq("id", procedure.version_actuelle_id)
        .maybeSingle()
    : { data: null };

  let approverName: string | null = null;
  if (version?.approved_by) {
    const { data: approver } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", version.approved_by)
      .maybeSingle();
    approverName = approver?.full_name ?? approver?.email ?? null;
  }

  const isPublished = Boolean(version);
  const contenu = (version?.contenu_snapshot ?? procedure.contenu ?? null) as JSONContent | null;

  // Pour une version publiée, on restitue les rubriques figées dans l'instantané ;
  // sinon (brouillon), les rubriques courantes de la procédure.
  type SectionsSrc = {
    objet: string | null;
    domaine_application: string | null;
    resume: string | null;
    diffusion: string | null;
    glossaire_sigles: string | null;
    glossaire_symboles: string | null;
    glossaire_abreviations: string | null;
    definitions: unknown;
    references_doc: unknown;
    references_appli: unknown;
    logigramme_svg: string | null;
  };
  const src = ((version?.sections_snapshot as unknown as SectionsSrc | null) ??
    procedure) as SectionsSrc;

  const meta = isPublished
    ? [
        procedure.reference_iso?.length
          ? { label: "Réf. ISO", value: procedure.reference_iso.join(", ") }
          : null,
        { label: "Version", value: version?.version ?? "-" },
        { label: "Rédacteur", value: version?.redacteur ?? "-" },
        { label: "Vérificateur", value: version?.verificateur ?? "-" },
        { label: "Approbateur", value: approverName ?? "-" },
        { label: "Approuvée le", value: formatDate(version?.approved_at ?? null) },
      ].filter((m): m is { label: string; value: string } => m !== null)
    : [{ label: "Statut", value: "Brouillon (non publié)" }];

  return (
    <PrintShell
      backHref={`/documentation/procedures/${id}`}
      surtitre="Procédure"
      titre={procedure.titre}
      societe={tenant as Societe}
      meta={meta}
      genereLe={formatDate(todayISO())}
    >
      <ProcedureSections
        objet={src.objet}
        domaineApplication={src.domaine_application}
        resume={src.resume}
        diffusion={src.diffusion}
        glossaireSigles={src.glossaire_sigles}
        glossaireSymboles={src.glossaire_symboles}
        glossaireAbreviations={src.glossaire_abreviations}
        definitions={(src.definitions as unknown as ProcDef[] | null) ?? []}
        referencesDoc={(src.references_doc as unknown as ProcRef[] | null) ?? []}
        referencesAppli={(src.references_appli as unknown as ProcRef[] | null) ?? []}
        logigrammeSvg={src.logigramme_svg}
      />
      <TiptapEditor content={contenu} editable={false} bare />
    </PrintShell>
  );
}
