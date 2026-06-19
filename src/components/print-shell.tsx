import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";

export type Societe = {
  nom_societe: string;
  logo_url: string | null;
  forme_juridique?: string | null;
  siret?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  mentions_legales?: string | null;
};

function ligneLegale(s: Societe): string {
  const parts = [
    s.nom_societe,
    s.forme_juridique,
    s.siret ? `SIRET ${s.siret}` : null,
    [s.adresse, [s.code_postal, s.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ") ||
      null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/**
 * Mise en page d'un document officiel imprimable : en-tête (logo client + titre
 * + métadonnées), corps, pied de page légal société. Barre d'action masquée à
 * l'impression.
 */
export function PrintShell({
  backHref,
  surtitre,
  titre,
  societe,
  meta,
  genereLe,
  children,
}: {
  backHref: string;
  surtitre?: string;
  titre: string;
  societe: Societe;
  meta?: { label: string; value: string }[];
  genereLe?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-surface print:bg-white">
      <style>{`@media print { @page { margin: 16mm; } .doc-page { box-shadow: none !important; } }`}</style>

      <div className="flex items-center justify-between gap-2 border-b bg-card px-6 py-3 print:hidden">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Link>
        <PrintButton />
      </div>

      <article className="doc-page mx-auto my-8 max-w-3xl bg-white p-12 text-[#0b1120] shadow-sm print:my-0 print:max-w-none print:p-0">
        <header className="mb-8 flex items-start justify-between gap-6 border-b-2 border-[#0b1120]/10 pb-5">
          <div className="min-w-0">
            {surtitre ? (
              <p className="font-medium text-[#0b1120]/50 text-xs uppercase tracking-[0.12em]">
                {surtitre}
              </p>
            ) : null}
            <h1 className="mt-1 font-semibold text-2xl tracking-tight">{titre}</h1>
            <p className="mt-1 text-[#0b1120]/60 text-sm">{societe.nom_societe}</p>
          </div>
          {societe.logo_url ? (
            // biome-ignore lint/performance/noImgElement: logo client, document imprimable
            <img
              src={societe.logo_url}
              alt={societe.nom_societe}
              className="h-16 w-auto shrink-0 object-contain"
            />
          ) : null}
        </header>

        {meta && meta.length > 0 ? (
          <dl className="mb-8 grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg bg-[#0b1120]/[0.03] p-4 text-sm sm:grid-cols-3">
            {meta.map((m) => (
              <div key={m.label} className="flex flex-col">
                <dt className="text-[#0b1120]/45 text-xs uppercase tracking-wide">{m.label}</dt>
                <dd className="font-medium">{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="leading-relaxed">{children}</div>

        <footer className="mt-12 border-[#0b1120]/10 border-t pt-4 text-[#0b1120]/55 text-[11px] leading-relaxed">
          <p className="font-medium">{ligneLegale(societe)}</p>
          {societe.mentions_legales ? <p>{societe.mentions_legales}</p> : null}
          {genereLe ? <p className="mt-1">Document généré le {genereLe}.</p> : null}
        </footer>
      </article>
    </div>
  );
}
