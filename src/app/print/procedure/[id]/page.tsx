import type { JSONContent } from "@tiptap/react";
import { PrintShell, type Societe } from "@/components/print-shell";
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
      "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales",
    )
    .eq("id", tid)
    .maybeSingle();

  const { data: procedure } = await supabase
    .from("procedures")
    .select("titre, contenu, version_actuelle_id, reference_iso")
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!procedure) {
    return <p className="p-8 text-sm">Procédure introuvable.</p>;
  }

  const { data: version } = procedure.version_actuelle_id
    ? await supabase
        .from("procedures_versions")
        .select("version, approved_at, approved_by, contenu_snapshot, redacteur, verificateur")
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

  const meta = isPublished
    ? [
        procedure.reference_iso?.length
          ? { label: "Réf. ISO", value: procedure.reference_iso.join(", ") }
          : null,
        { label: "Version", value: version?.version ?? "—" },
        { label: "Rédacteur", value: version?.redacteur ?? "—" },
        { label: "Vérificateur", value: version?.verificateur ?? "—" },
        { label: "Approbateur", value: approverName ?? "—" },
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
      <TiptapEditor content={contenu} editable={false} bare />
    </PrintShell>
  );
}
