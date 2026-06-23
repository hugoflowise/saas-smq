export type Societe = {
  nom_societe: string;
  logo_url: string | null;
  forme_juridique?: string | null;
  siret?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  mentions_legales?: string | null;
  /** Couleur principale de la charte graphique du client (hex). */
  couleur_charte?: string | null;
};

// Couleur d'accent par défaut (neutre) si le client n'a pas défini de charte.
const CHARTE_DEFAUT = "#0b1120";

/** Convertit un hex (#rrggbb) en rgba ; retombe sur la couleur par défaut si invalide. */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hexToRgba(CHARTE_DEFAUT, alpha);
  const n = Number.parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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
 * corps, pied de page légal société. Les accents (surtitre, filets, encadré de
 * métadonnées) reprennent la couleur de charte du client.
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
  const charte = /^#?[0-9a-f]{6}$/i.test((societe.couleur_charte ?? "").trim())
    ? (societe.couleur_charte as string)
    : CHARTE_DEFAUT;

  return (
    <article
      className={`doc-page mx-auto max-w-3xl bg-white p-12 text-[#0b1120] shadow-sm ${className ?? ""}`}
    >
      <header
        className="mb-8 flex items-start justify-between gap-6 pb-5"
        style={{ borderBottom: `2px solid ${hexToRgba(charte, 0.3)}` }}
      >
        <div className="min-w-0 border-l-4 pl-3" style={{ borderColor: charte }}>
          {surtitre ? (
            <p
              className="font-medium text-xs uppercase tracking-[0.12em]"
              style={{ color: charte }}
            >
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
        <dl
          className="mb-8 grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg p-4 text-sm sm:grid-cols-3"
          style={{ backgroundColor: hexToRgba(charte, 0.06) }}
        >
          {meta.map((m) => (
            <div key={m.label} className="flex flex-col">
              <dt
                className="text-xs uppercase tracking-wide"
                style={{ color: hexToRgba(charte, 0.8) }}
              >
                {m.label}
              </dt>
              <dd className="font-medium">{m.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="leading-relaxed">{children}</div>

      <footer
        className="mt-12 pt-4 text-[#0b1120]/55 text-[11px] leading-relaxed"
        style={{ borderTop: `1px solid ${hexToRgba(charte, 0.25)}` }}
      >
        <p className="font-medium">{ligneLegale(societe)}</p>
        {societe.mentions_legales ? <p>{societe.mentions_legales}</p> : null}
        {genereLe ? <p className="mt-1">Document généré le {genereLe}.</p> : null}
      </footer>
    </article>
  );
}
