export type ProcRef = { numero: string; reference: string; designation: string };
export type ProcDef = { terme: string; definition: string };

export type ProcedureSectionsData = {
  objet: string | null;
  domaineApplication: string | null;
  resume: string | null;
  diffusion: string | null;
  glossaireSigles: string | null;
  glossaireSymboles: string | null;
  glossaireAbreviations: string | null;
  definitions: ProcDef[];
  referencesDoc: ProcRef[];
  referencesAppli: ProcRef[];
  /** Logigramme (image SVG/data URL exportée depuis draw.io), optionnel. */
  logigrammeSvg?: string | null;
};

const HEAD: React.CSSProperties = {
  backgroundColor: "var(--charte)",
  color: "var(--charte-contrast)",
};

function Section({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 first:mt-0">
      <h2 className="mb-2 font-semibold text-base">
        {n}. {titre}
      </h2>
      {children}
    </section>
  );
}

function Texte({ valeur }: { valeur: string | null }) {
  return <p className="whitespace-pre-wrap text-sm">{valeur?.trim() ? valeur : "-"}</p>;
}

/** Liste à puces depuis un texte multi-lignes (une entrée par ligne). */
function Puces({ valeur }: { valeur: string | null }) {
  const lignes = (valeur ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);
  if (lignes.length === 0) return <p className="text-[#0b1120]/50 text-sm">Sans objet</p>;
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-sm">
      {lignes.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

function TableReferences({ refs }: { refs: ProcRef[] }) {
  if (refs.length === 0) return <p className="text-[#0b1120]/50 text-sm">-</p>;
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr style={HEAD}>
          <th className="w-16 px-3 py-1.5 text-left font-semibold">N°</th>
          <th className="w-48 px-3 py-1.5 text-left font-semibold">Référence</th>
          <th className="px-3 py-1.5 text-left font-semibold">Désignation du document</th>
        </tr>
      </thead>
      <tbody>
        {refs.map((r, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rendu statique
          <tr key={`${r.reference}-${i}`} className="border-b align-top">
            <td className="px-3 py-2">{r.numero?.trim() || `[${i + 1}]`}</td>
            <td className="px-3 py-2">{r.reference?.trim() || "-"}</td>
            <td className="px-3 py-2">{r.designation?.trim() || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Rubriques standard d'une procédure maîtrisée (objet, domaine, références,
 * glossaire, définitions), rendues sur le gabarit charté avant le contenu/
 * déroulement (éditeur de texte riche). Partagé écran + impression.
 */
export function ProcedureSections(d: ProcedureSectionsData) {
  const aGlossaire = d.glossaireSigles || d.glossaireSymboles || d.glossaireAbreviations;
  return (
    <div className="flex flex-col">
      {d.resume?.trim() || d.diffusion?.trim() ? (
        <div className="mb-6 overflow-hidden rounded-md border text-sm">
          {d.resume?.trim() ? (
            <div className="flex border-b">
              <span className="w-28 shrink-0 px-3 py-2 font-semibold" style={HEAD}>
                Résumé
              </span>
              <span className="whitespace-pre-wrap px-3 py-2">{d.resume}</span>
            </div>
          ) : null}
          {d.diffusion?.trim() ? (
            <div className="flex">
              <span className="w-28 shrink-0 px-3 py-2 font-semibold" style={HEAD}>
                Diffusion
              </span>
              <span className="whitespace-pre-wrap px-3 py-2">{d.diffusion}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <Section n={1} titre="Objet">
        <Texte valeur={d.objet} />
      </Section>
      <Section n={2} titre="Domaine d'application">
        <Texte valeur={d.domaineApplication} />
      </Section>
      <Section n={3} titre="Documents de référence">
        <TableReferences refs={d.referencesDoc} />
      </Section>
      <Section n={4} titre="Documents applicables">
        <TableReferences refs={d.referencesAppli} />
      </Section>
      <Section n={5} titre="Glossaire">
        {aGlossaire ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 font-medium text-sm">Sigles</p>
              <Puces valeur={d.glossaireSigles} />
            </div>
            <div>
              <p className="mb-1 font-medium text-sm">Symboles</p>
              <Puces valeur={d.glossaireSymboles} />
            </div>
            <div>
              <p className="mb-1 font-medium text-sm">Abréviations</p>
              <Puces valeur={d.glossaireAbreviations} />
            </div>
          </div>
        ) : (
          <p className="text-[#0b1120]/50 text-sm">Sans objet</p>
        )}
      </Section>
      <Section n={6} titre="Définitions">
        {d.definitions.length === 0 ? (
          <p className="text-[#0b1120]/50 text-sm">-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={HEAD}>
                <th className="w-56 px-3 py-1.5 text-left font-semibold">Terme</th>
                <th className="px-3 py-1.5 text-left font-semibold">Définition</th>
              </tr>
            </thead>
            <tbody>
              {d.definitions.map((def, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: rendu statique
                <tr key={`${def.terme}-${i}`} className="border-b align-top">
                  <td className="px-3 py-2 font-medium">{def.terme?.trim() || "-"}</td>
                  <td className="whitespace-pre-wrap px-3 py-2">{def.definition?.trim() || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {d.logigrammeSvg?.trim() ? (
        <Section n={7} titre="Logigramme">
          {/* biome-ignore lint/performance/noImgElement: logigramme exporté (SVG data URL), document imprimable */}
          <img
            src={d.logigrammeSvg}
            alt="Logigramme de la procédure"
            className="mx-auto max-h-[28rem] w-auto max-w-full"
          />
        </Section>
      ) : null}

      <h2 className="mt-7 mb-2 font-semibold text-base">
        {d.logigrammeSvg?.trim() ? 8 : 7}. Contenu de la procédure
      </h2>
    </div>
  );
}
