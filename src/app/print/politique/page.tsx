import type { JSONContent } from "@tiptap/react";
import { PrintShell, type Societe } from "@/components/print-shell";
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
      "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales",
    )
    .eq("id", tid)
    .maybeSingle();

  const { data: politique } = await supabase
    .from("politique_qualite")
    .select("contenu, statut, version_actuelle_id")
    .eq("tenant_id", tid)
    .maybeSingle();

  const { data: version } = politique?.version_actuelle_id
    ? await supabase
        .from("politique_qualite_versions")
        .select("version, approved_at, approved_by, contenu_snapshot")
        .eq("id", politique.version_actuelle_id)
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
  const contenu = (version?.contenu_snapshot ?? politique?.contenu ?? null) as JSONContent | null;

  const meta = isPublished
    ? [
        { label: "Version", value: version?.version ?? "-" },
        { label: "Approuvée le", value: formatDate(version?.approved_at ?? null) },
        { label: "Signataire", value: approverName ?? "-" },
        { label: "Statut", value: "Publiée" },
      ]
    : [{ label: "Statut", value: "Brouillon (non publié)" }];

  return (
    <PrintShell
      backHref="/strategie/politique"
      surtitre="Document maîtrisé"
      titre="Politique qualité"
      societe={tenant as Societe}
      meta={meta}
      genereLe={formatDate(todayISO())}
    >
      <TiptapEditor content={contenu} editable={false} bare />
    </PrintShell>
  );
}
