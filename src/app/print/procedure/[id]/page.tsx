import type { JSONContent } from "@tiptap/react";
import { PrintShell, type Societe } from "@/components/print-shell";
import type { RevisionLigne } from "@/components/procedure-revision-table";
import { type ProcDef, ProcedureSections, type ProcRef } from "@/components/procedure-sections";
import { SignatairesBlock } from "@/components/signataires";
import { TiptapEditor } from "@/components/tiptap-editor";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionLettre } from "@/lib/versions";

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
      "titre, contenu, version_actuelle_id, statut, note_revision, soumis_par, verifie_par, approved_by, reference_iso, objet, domaine_application, resume, diffusion, glossaire_sigles, glossaire_symboles, glossaire_abreviations, definitions, references_doc, references_appli",
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
          "version, approved_at, approved_by, redige_par, redige_le, verifie_par, verifie_le, contenu_snapshot, sections_snapshot",
        )
        .eq("id", procedure.version_actuelle_id)
        .maybeSingle()
    : { data: null };

  // Toutes les versions publiées pour le tableau de révision en tête.
  const { data: allVersions } = await supabase
    .from("procedures_versions")
    .select("id, version, approved_at, approved_by, redige_par, verifie_par, note_revision")
    .eq("procedure_id", id)
    .order("created_at", { ascending: false });

  // Noms + signatures des 3 rôles : version courante + toutes les versions.
  const signerIds = [
    ...new Set(
      [
        version?.redige_par,
        version?.verifie_par,
        version?.approved_by,
        // Signataires courants de la procédure : nécessaires pour la ligne
        // « version en cours » quand la procédure n'est pas publiée.
        procedure.soumis_par,
        procedure.verifie_par,
        procedure.approved_by,
        ...(allVersions ?? []).flatMap((v) => [v.redige_par, v.verifie_par, v.approved_by]),
      ].filter(Boolean),
    ),
  ] as string[];
  const { data: signers } = signerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, signature_image")
        .in("id", signerIds)
    : { data: [] };
  const nameById = new Map((signers ?? []).map((p) => [p.id, p.full_name ?? p.email]));
  const sigById = new Map((signers ?? []).map((p) => [p.id, p.signature_image]));

  const revisions = (allVersions ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    approvedAt: v.approved_at,
    noteRevision: v.note_revision,
    redacteur: v.redige_par ? (nameById.get(v.redige_par) ?? null) : null,
    redacteurSignature: v.redige_par ? (sigById.get(v.redige_par) ?? null) : null,
    verificateur: v.verifie_par ? (nameById.get(v.verifie_par) ?? null) : null,
    verificateurSignature: v.verifie_par ? (sigById.get(v.verifie_par) ?? null) : null,
    approverName: v.approved_by ? (nameById.get(v.approved_by) ?? null) : null,
    approverSignature: v.approved_by ? (sigById.get(v.approved_by) ?? null) : null,
  }));

  const isPublished = Boolean(version);

  // Ligne provisoire « version en cours » à l'impression, par cohérence avec la
  // vue lecture : présente tant que la procédure n'est pas publiée à jour.
  const versionEnCours: RevisionLigne | null =
    procedure.statut !== "publiee"
      ? {
          id: "en-cours",
          version: versionLettre(revisions.length),
          approvedAt: todayISO(),
          noteRevision: procedure.note_revision,
          redacteur: procedure.soumis_par ? (nameById.get(procedure.soumis_par) ?? null) : null,
          redacteurSignature: procedure.soumis_par
            ? (sigById.get(procedure.soumis_par) ?? null)
            : null,
          verificateur: procedure.verifie_par
            ? (nameById.get(procedure.verifie_par) ?? null)
            : null,
          verificateurSignature: procedure.verifie_par
            ? (sigById.get(procedure.verifie_par) ?? null)
            : null,
          approverName: procedure.approved_by
            ? (nameById.get(procedure.approved_by) ?? null)
            : null,
          approverSignature: procedure.approved_by
            ? (sigById.get(procedure.approved_by) ?? null)
            : null,
          enCours: true,
        }
      : null;
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
  };
  const src = ((version?.sections_snapshot as unknown as SectionsSrc | null) ??
    procedure) as SectionsSrc;

  const meta = isPublished
    ? [
        procedure.reference_iso?.length
          ? { label: "Réf. ISO", value: procedure.reference_iso.join(", ") }
          : null,
        { label: "Version", value: version?.version ?? "-" },
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
        versions={revisions}
        versionEnCours={versionEnCours}
      />
      <div className="doc-chapitres" style={{ counterReset: "chap 5" }}>
        <TiptapEditor content={contenu} editable={false} bare />
      </div>
      {isPublished ? (
        <SignatairesBlock
          className="mt-8"
          cells={[
            {
              label: "Rédigé par",
              nom: version?.redige_par ? (nameById.get(version.redige_par) ?? null) : null,
              image: version?.redige_par ? (sigById.get(version.redige_par) ?? null) : null,
              date: version?.redige_le ?? null,
              signe: Boolean(version?.redige_par),
            },
            {
              label: "Vérifié par",
              nom: version?.verifie_par ? (nameById.get(version.verifie_par) ?? null) : null,
              image: version?.verifie_par ? (sigById.get(version.verifie_par) ?? null) : null,
              date: version?.verifie_le ?? null,
              signe: Boolean(version?.verifie_par),
            },
            {
              label: "Approuvé par",
              nom: version?.approved_by ? (nameById.get(version.approved_by) ?? null) : null,
              image: version?.approved_by ? (sigById.get(version.approved_by) ?? null) : null,
              date: version?.approved_at ?? null,
              signe: Boolean(version?.approved_by),
            },
          ]}
        />
      ) : null}
    </PrintShell>
  );
}
