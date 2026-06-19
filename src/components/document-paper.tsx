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
 * Feuille de document officiel : en-tête (logo client + titre + métadonnées),
 * corps, pied de page légal société. Utilisée à l'identique à l'écran (version
 * validée) et à l'impression (via PrintShell).
 */
export function DocumentPaper({
  surtitre,
  titre,
  societe,
  meta,
  genereLe,
  className,
  children,
}: {
  surtitre?: string;
  titre: string;
  societe: Societe;
  meta?: { label: string; value: string }[];
  genereLe?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`doc-page mx-auto max-w-3xl bg-white p-12 text-[#0b1120] shadow-sm ${className ?? ""}`}
    >
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
  );
}
