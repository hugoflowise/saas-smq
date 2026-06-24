import Link from "next/link";
import type { CSSProperties } from "react";

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
const CHARTE_DEFAUT = "#5b7a8c";

function normHex(hex: string | null | undefined): string {
  return /^#?[0-9a-f]{6}$/i.test((hex ?? "").trim())
    ? `#${(hex as string).trim().replace(/^#/, "")}`
    : CHARTE_DEFAUT;
}

/** Convertit un hex (#rrggbb) en rgba. */
function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.replace(/^#/, ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Texte lisible (blanc ou foncé) sur un fond de couleur charte. */
function texteContraste(hex: string): string {
  const n = Number.parseInt(hex.replace(/^#/, ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0b1120" : "#ffffff";
}

/** Couleurs de charte résolues (réutilisé par l'en-tête répété à l'impression). */
export function charteColors(couleur: string | null | undefined) {
  const charte = normHex(couleur);
  return {
    charte,
    contrast: texteContraste(charte),
    teinte: (alpha: number) => rgba(charte, alpha),
  };
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
 * Feuille de document officiel, calquée sur le modèle de fiche maîtrisée :
 * bandeau d'en-tête coloré (type + intitulé) + mini-tableau d'identité + logo,
 * titres de section et tableaux à la couleur de charte, pied de page légal.
 * Utilisée à l'écran (édition + lecture) et à l'impression.
 */
export function DocumentPaper({
  surtitre,
  titre,
  societe,
  meta,
  genereLe,
  className,
  hideHeaderOnPrint,
  children,
}: {
  surtitre?: string;
  titre: string;
  societe: Societe;
  meta?: { label: string; value: string; href?: string }[];
  genereLe?: string;
  className?: string;
  /** Masque l'en-tête à l'impression (un en-tête répété est alors fourni autour). */
  hideHeaderOnPrint?: boolean;
  children: React.ReactNode;
}) {
  const charte = normHex(societe.couleur_charte);
  const surBande = texteContraste(charte);
  const items = meta ?? [];

  // Variables de charte exposées au corps : couleur + texte contrasté, pour les
  // titres de section et les en-têtes de tableaux des documents structurés.
  const style = { "--charte": charte, "--charte-contrast": surBande } as CSSProperties;

  return (
    <article
      style={style}
      className={`doc-page mx-auto max-w-3xl bg-white p-10 text-[#0b1120] shadow-sm ${className ?? ""}`}
    >
      <header
        className={`mb-8 flex items-stretch gap-3 ${hideHeaderOnPrint ? "print:hidden" : ""}`}
      >
        {/* Bandeau titre coloré (type + intitulé) */}
        <div
          className="flex min-w-0 flex-1 flex-col justify-center rounded-md px-4 py-3"
          style={{ backgroundColor: charte, color: surBande }}
        >
          {surtitre ? (
            <p className="font-semibold text-sm uppercase tracking-[0.08em]">{surtitre}</p>
          ) : null}
          <p className="mt-0.5 text-sm italic opacity-90">{titre}</p>
        </div>

        {/* Mini-tableau d'identité (statut, version…) */}
        {items.length > 0 ? (
          <div
            className="hidden w-64 shrink-0 overflow-hidden rounded-md border text-xs sm:block"
            style={{ borderColor: rgba(charte, 0.35) }}
          >
            {items.slice(0, 3).map((m) => (
              <div key={m.label} className="flex border-b last:border-b-0">
                <span
                  className="w-24 shrink-0 px-2 py-1.5 font-semibold"
                  style={{ backgroundColor: rgba(charte, 0.12), color: rgba(charte, 0.95) }}
                >
                  {m.label}
                </span>
                <span className="px-2 py-1.5">
                  {m.href ? (
                    <Link href={m.href} className="underline" style={{ color: charte }}>
                      {m.value}
                    </Link>
                  ) : (
                    m.value
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {societe.logo_url ? (
          // biome-ignore lint/performance/noImgElement: logo client, document imprimable
          <img
            src={societe.logo_url}
            alt={societe.nom_societe}
            className="h-16 w-auto shrink-0 self-start object-contain"
          />
        ) : null}
      </header>

      {/* Métadonnées complémentaires (au-delà des 3 affichées dans l'en-tête) */}
      {items.length > 3 ? (
        <dl
          className="mb-8 grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg p-4 text-sm sm:grid-cols-3"
          style={{ backgroundColor: rgba(charte, 0.06) }}
        >
          {items.slice(3).map((m) => (
            <div key={m.label} className="flex flex-col">
              <dt className="text-xs uppercase tracking-wide" style={{ color: rgba(charte, 0.8) }}>
                {m.label}
              </dt>
              <dd className="font-medium">
                {m.href ? (
                  <Link href={m.href} className="underline" style={{ color: charte }}>
                    {m.value}
                  </Link>
                ) : (
                  m.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="leading-relaxed [&_:is(h1,h2,h3)]:font-semibold [&_:is(h1,h2,h3)]:text-[color:var(--charte)]">
        {children}
      </div>

      <footer
        className="mt-12 flex flex-wrap items-center justify-between gap-2 pt-3 text-[#0b1120]/55 text-[11px] leading-relaxed"
        style={{ borderTop: `2px solid ${rgba(charte, 0.3)}` }}
      >
        <p className="font-medium italic">{titre}</p>
        {genereLe ? <p>Document généré le {genereLe}</p> : null}
      </footer>

      <div className="mt-1 text-[#0b1120]/45 text-[10px] leading-relaxed">
        <p>{ligneLegale(societe)}</p>
        {societe.mentions_legales ? <p>{societe.mentions_legales}</p> : null}
      </div>
    </article>
  );
}
