import type { JSONContent } from "@tiptap/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TiptapEditor } from "@/components/tiptap-editor";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { PrintButton } from "./print-button";

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function PolitiquePrintPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return <p className="p-8 text-sm">Aucun client sélectionné.</p>;
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("nom_societe, logo_url")
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

  return (
    <div className="min-h-full bg-surface">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="flex items-center justify-between gap-2 border-b bg-card px-6 py-3 print:hidden">
        <Link
          href="/strategie/politique"
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Link>
        <PrintButton />
      </div>

      {/* Document */}
      <div className="mx-auto my-8 max-w-3xl bg-white p-10 shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="mb-8 flex items-start justify-between gap-6 border-b pb-6">
          <div>
            <p className="font-semibold text-2xl tracking-tight">Politique qualité</p>
            <p className="mt-1 text-muted-foreground">{tenant?.nom_societe}</p>
          </div>
          {tenant?.logo_url ? (
            // biome-ignore lint/performance/noImgElement: logo externe, document imprimable
            <img src={tenant.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
          ) : null}
        </header>

        {!isPublished ? (
          <p className="mb-6 rounded-md bg-status-pa/15 px-3 py-2 text-status-pa text-sm">
            Document non publié — aperçu du brouillon en cours.
          </p>
        ) : null}

        <TiptapEditor content={contenu} editable={false} bare />

        <footer className="mt-10 border-t pt-6 text-sm">
          {isPublished ? (
            <div className="flex flex-wrap justify-between gap-4">
              <span>
                <span className="text-muted-foreground">Version </span>
                <strong>{version?.version}</strong>
              </span>
              <span>
                <span className="text-muted-foreground">Approuvée le </span>
                {formatDate(version?.approved_at ?? null)}
              </span>
              <span>
                <span className="text-muted-foreground">Signataire : </span>
                {approverName ?? "—"}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">Version de travail, non approuvée.</p>
          )}
        </footer>
      </div>
    </div>
  );
}
