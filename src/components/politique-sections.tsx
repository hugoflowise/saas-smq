export type PolitiqueSectionsData = {
  presentation: string | null;
  valeurs: string | null;
  engagementsIntro: string | null;
  engagements: { libelle: string }[];
  objectifsTexte: string | null;
  engagementDirection: string | null;
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
  return valeur?.trim() ? (
    <p className="whitespace-pre-wrap text-sm">{valeur}</p>
  ) : (
    <p className="text-[#0b1120]/50 text-sm">À compléter</p>
  );
}

/** Liste à puces depuis un texte multi-lignes (une entrée par ligne). */
function Puces({ valeur }: { valeur: string | null }) {
  const lignes = (valeur ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);
  if (lignes.length === 0) return <p className="text-[#0b1120]/50 text-sm">À compléter</p>;
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-sm">
      {lignes.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/**
 * Rubriques standard de la politique qualité (présentation, valeurs, engagements,
 * objectifs, engagement de la direction). La section « Nos engagements » liste
 * les engagements structurés (reliés aux objectifs/KPI). Partagé écran + impression.
 */
export function PolitiqueSections(d: PolitiqueSectionsData) {
  return (
    <div className="flex flex-col">
      <Section n={1} titre="Présentation et périmètre d'application">
        <Texte valeur={d.presentation} />
      </Section>

      <Section n={2} titre="Nos valeurs">
        <Puces valeur={d.valeurs} />
      </Section>

      <Section n={3} titre="Nos engagements">
        {d.engagementsIntro?.trim() ? (
          <p className="mb-2 whitespace-pre-wrap text-sm">{d.engagementsIntro}</p>
        ) : null}
        {d.engagements.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-5 text-sm">
            {d.engagements.map((e) => (
              <li key={e.libelle}>{e.libelle}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[#0b1120]/50 text-sm">
            À compléter (ajoutez vos engagements dans l'encart « Engagements de la politique »).
          </p>
        )}
      </Section>

      <Section n={4} titre="Nos objectifs">
        <Texte valeur={d.objectifsTexte} />
      </Section>

      <Section n={5} titre="Engagement de la Direction">
        <Puces valeur={d.engagementDirection} />
      </Section>
    </div>
  );
}
