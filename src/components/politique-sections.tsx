import Link from "next/link";

/** Engagements-types de la direction (ISO 9001), pré-remplis tant que non modifiés. */
export const ENGAGEMENTS_DIRECTION_DEFAUT = [
  "Allouer les ressources humaines, financières et techniques nécessaires à la mise en œuvre de cette politique",
  "Désigner un Responsable du Système de Management (RSMQ) chargé de coordonner la démarche",
  "Piloter l'efficacité du système au travers d'une revue de direction annuelle",
  "Veiller à la conformité aux exigences légales, réglementaires et normatives applicables",
  "Améliorer en continu la pertinence, l'adéquation et l'efficacité du Système de Management",
].join("\n");

export type PolitiqueSectionsData = {
  presentation: string | null;
  valeurs: string | null;
  engagementsIntro: string | null;
  engagements: { libelle: string }[];
  objectifsTexte: string | null;
  engagementDirection: string | null;
  /** true à l'impression : le lien vers les objectifs n'est pas cliquable. */
  print?: boolean;
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
            À compléter : modifiez le document et ajoutez vos engagements dans la section « Nos
            engagements ».
          </p>
        )}
      </Section>

      <Section n={4} titre="Nos objectifs">
        {d.objectifsTexte?.trim() ? (
          <p className="mb-2 whitespace-pre-wrap text-sm">{d.objectifsTexte}</p>
        ) : (
          <p className="mb-2 text-sm">
            Nos objectifs qualité sont définis, déclinés par processus et suivis dans un tableau de
            bord dédié, revus annuellement en revue de direction.
          </p>
        )}
        {d.print ? (
          <p className="text-[#0b1120]/60 text-sm">
            Voir les objectifs qualité dans l'application.
          </p>
        ) : (
          <Link href="/strategie/objectifs" className="text-primary text-sm hover:underline">
            → Voir les objectifs qualité
          </Link>
        )}
      </Section>

      <Section n={5} titre="Engagement de la Direction">
        <p className="mb-1 text-[#0b1120]/60 text-xs">La Direction s'engage à :</p>
        <Puces
          valeur={
            d.engagementDirection?.trim() ? d.engagementDirection : ENGAGEMENTS_DIRECTION_DEFAUT
          }
        />
      </Section>
    </div>
  );
}
