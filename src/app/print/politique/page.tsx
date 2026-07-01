import type { JSONContent } from "@tiptap/react";
import { PolitiqueSections } from "@/components/politique-sections";
import { PrintShell, type Societe } from "@/components/print-shell";
import { SignatairesBlock } from "@/components/signataires";
import { TiptapEditor } from "@/components/tiptap-editor";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

export default async function PolitiquePrintPage() {
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

  const { data: politique } = await supabase
    .from("politique_qualite")
    .select(
      "code, contenu, statut, version_actuelle_id, presentation, valeurs, engagements_intro, objectifs_texte, engagement_direction",
    )
    .eq("tenant_id", tid)
    .maybeSingle();

  const { data: version } = politique?.version_actuelle_id
    ? await supabase
        .from("politique_qualite_versions")
        .select(
          "version, approved_at, approved_by, redige_par, redige_le, verifie_par, verifie_le, contenu_snapshot",
        )
        .eq("id", politique.version_actuelle_id)
        .maybeSingle()
    : { data: null };

  // Noms + signatures des 3 rôles figés dans la version publiée.
  const signerIds = [version?.redige_par, version?.verifie_par, version?.approved_by].filter(
    Boolean,
  ) as string[];
  const { data: signers } = signerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, signature_image")
        .in("id", signerIds)
    : { data: [] };
  const nameById = new Map((signers ?? []).map((p) => [p.id, p.full_name ?? p.email]));
  const sigById = new Map((signers ?? []).map((p) => [p.id, p.signature_image]));
  const approverName = version?.approved_by ? (nameById.get(version.approved_by) ?? null) : null;

  const isPublished = Boolean(version);
  const contenu = (version?.contenu_snapshot ?? politique?.contenu ?? null) as JSONContent | null;

  // Engagements de la politique (§6.2), listés dans le document imprimé.
  const { data: engagements } = await supabase
    .from("politique_engagements")
    .select("id, libelle")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .order("ordre", { ascending: true });

  const reference = politique?.code?.trim() || "-";
  const meta = isPublished
    ? [
        { label: "Référence", value: reference },
        { label: "Version", value: version?.version ?? "-" },
        { label: "Approuvée le", value: formatDate(version?.approved_at ?? null) },
        { label: "Signataire", value: approverName ?? "-" },
        { label: "Statut", value: "Publiée" },
      ]
    : [
        { label: "Référence", value: reference },
        { label: "Statut", value: "Brouillon (non publié)" },
      ];

  return (
    <PrintShell
      backHref="/strategie/politique"
      surtitre="Document maîtrisé"
      titre="Politique qualité"
      societe={tenant as Societe}
      meta={meta}
      genereLe={formatDate(todayISO())}
    >
      <PolitiqueSections
        print
        presentation={politique?.presentation ?? null}
        valeurs={politique?.valeurs ?? null}
        engagementsIntro={politique?.engagements_intro ?? null}
        engagements={(engagements ?? []).map((e) => ({ libelle: e.libelle }))}
        objectifsTexte={politique?.objectifs_texte ?? null}
        engagementDirection={politique?.engagement_direction ?? null}
      />
      <div className="mt-8">
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
              nom: approverName,
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
