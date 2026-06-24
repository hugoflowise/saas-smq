import { DocumentPaper, type Societe } from "@/components/document-paper";
import { formatDate } from "@/lib/format";

export type FicheActivite = {
  activite: string;
  responsable: string | null;
  documents: string | null;
};
export type FicheInteraction = { sens: string; partenaire: string; nature: string | null };
export type FicheIndicateur = { nom: string; cible: number | null; unite: string | null };
export type FicheRisque = { intitule: string; type: string; criticite: number | null };
export type FicheDocument = { reference: string | null; intitule: string; type: string };

export type FicheProcessusData = {
  societe: Societe;
  nom: string;
  typeLabel: string;
  piloteName: string | null;
  finalite: string | null;
  perimetre: string | null;
  referentiels: string | null;
  entrees: string | null;
  sorties: string | null;
  ressources: string | null;
  activites: FicheActivite[];
  interactions: FicheInteraction[];
  indicateurs: FicheIndicateur[];
  risques: FicheRisque[];
  opportunites: FicheRisque[];
  documents: FicheDocument[];
  version: string | null;
  redacteur: string | null;
  verificateur: string | null;
  approbateur: string | null;
  approuveeLe: string | null;
  noteRevision: string | null;
  genereLe?: string;
};

const HEAD: React.CSSProperties = {
  backgroundColor: "var(--charte)",
  color: "var(--charte-contrast)",
};

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 first:mt-0">
      <h2 className="mb-2 font-semibold text-base">{titre}</h2>
      {children}
    </section>
  );
}

/** Liste à puces depuis un texte multi-lignes. */
function Puces({ texte }: { texte: string | null }) {
  const lignes = (texte ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);
  if (lignes.length === 0) return <p className="text-[#0b1120]/50 text-sm">-</p>;
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-sm">
      {lignes.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/** Rendu de la fiche d'identité d'un processus, sur le gabarit officiel charté. */
export function FicheProcessus(data: FicheProcessusData) {
  const meta = [
    { label: "Version", value: data.version ? data.version : "Projet (non approuvée)" },
    { label: "Type", value: data.typeLabel },
    ...(data.piloteName ? [{ label: "Pilote", value: data.piloteName }] : []),
  ];

  const carte: [string, string | null][] = [
    ["Intitulé du processus", data.nom],
    ["Type de processus", data.typeLabel],
    ["Pilote du processus", data.piloteName],
    ["Finalité", data.finalite],
    ["Périmètre", data.perimetre],
    ["Référentiels applicables", data.referentiels],
  ];

  return (
    <DocumentPaper
      surtitre="Fiche d'identité du processus"
      titre={data.nom}
      societe={data.societe}
      meta={meta}
      genereLe={data.genereLe}
      className="border"
    >
      {/* 1. Carte d'identité */}
      <Section titre="1. Carte d'identité du processus">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {carte.map(([label, value]) => (
              <tr key={label} className="border-b align-top">
                <th
                  className="w-56 px-3 py-2 text-left font-semibold"
                  style={{ backgroundColor: "color-mix(in srgb, var(--charte) 10%, white)" }}
                >
                  {label}
                </th>
                <td className="whitespace-pre-wrap px-3 py-2">{value?.trim() ? value : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 2. Données d'entrée / sortie */}
      <Section titre="2. Données d'entrée et de sortie">
        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-2">
            <div className="px-3 py-1.5 font-semibold text-sm" style={HEAD}>
              Données d'entrée
            </div>
            <div className="px-3 py-1.5 font-semibold text-sm" style={HEAD}>
              Données de sortie
            </div>
            <div className="border-t px-3 py-2">
              <Puces texte={data.entrees} />
            </div>
            <div className="border-t border-l px-3 py-2">
              <Puces texte={data.sorties} />
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Interactions */}
      <Section titre="3. Interactions avec les autres processus">
        {data.interactions.length === 0 ? (
          <p className="text-[#0b1120]/50 text-sm">-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={HEAD}>
                <th className="px-3 py-1.5 text-left font-semibold">Processus fournisseur</th>
                <th className="px-3 py-1.5 text-left font-semibold">Nature de l'interaction</th>
                <th className="px-3 py-1.5 text-left font-semibold">Processus client</th>
              </tr>
            </thead>
            <tbody>
              {data.interactions.map((it, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: rendu statique
                <tr key={`${it.sens}-${it.partenaire}-${i}`} className="border-b align-top">
                  <td className="px-3 py-2">{it.sens === "entrant" ? it.partenaire : data.nom}</td>
                  <td className="px-3 py-2">{it.nature ?? "-"}</td>
                  <td className="px-3 py-2">{it.sens === "entrant" ? data.nom : it.partenaire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* 4. Description des activités */}
      <Section titre="4. Description des activités">
        {data.activites.length === 0 ? (
          <p className="text-[#0b1120]/50 text-sm">-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={HEAD}>
                <th className="w-10 px-3 py-1.5 text-left font-semibold">N°</th>
                <th className="px-3 py-1.5 text-left font-semibold">Activité</th>
                <th className="px-3 py-1.5 text-left font-semibold">Responsable</th>
                <th className="px-3 py-1.5 text-left font-semibold">Documents / outils</th>
              </tr>
            </thead>
            <tbody>
              {data.activites.map((a, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: rendu statique
                <tr key={`${a.activite}-${i}`} className="border-b align-top">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{a.activite}</td>
                  <td className="px-3 py-2">{a.responsable ?? "-"}</td>
                  <td className="px-3 py-2">{a.documents ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* 5. Ressources */}
      <Section titre="5. Ressources nécessaires">
        <Puces texte={data.ressources} />
      </Section>

      {/* 6. Indicateurs */}
      <Section titre="6. Indicateurs de performance">
        {data.indicateurs.length === 0 ? (
          <p className="text-[#0b1120]/50 text-sm">-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={HEAD}>
                <th className="px-3 py-1.5 text-left font-semibold">Indicateur</th>
                <th className="px-3 py-1.5 text-left font-semibold">Objectif / cible</th>
              </tr>
            </thead>
            <tbody>
              {data.indicateurs.map((ind) => (
                <tr key={ind.nom} className="border-b align-top">
                  <td className="px-3 py-2">{ind.nom}</td>
                  <td className="px-3 py-2">
                    {ind.cible !== null ? `${ind.cible}${ind.unite ? ` ${ind.unite}` : ""}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* 7. Risques et opportunités */}
      <Section titre="7. Risques et opportunités">
        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-2">
            <div className="px-3 py-1.5 font-semibold text-sm" style={HEAD}>
              Risques identifiés
            </div>
            <div className="px-3 py-1.5 font-semibold text-sm" style={HEAD}>
              Opportunités
            </div>
            <ul className="list-disc space-y-0.5 border-t px-3 py-2 pl-7 text-sm">
              {data.risques.length === 0 ? (
                <li className="list-none text-[#0b1120]/50">-</li>
              ) : (
                data.risques.map((r) => <li key={r.intitule}>{r.intitule}</li>)
              )}
            </ul>
            <ul className="list-disc space-y-0.5 border-t border-l px-3 py-2 pl-7 text-sm">
              {data.opportunites.length === 0 ? (
                <li className="list-none text-[#0b1120]/50">-</li>
              ) : (
                data.opportunites.map((o) => <li key={o.intitule}>{o.intitule}</li>)
              )}
            </ul>
          </div>
        </div>
      </Section>

      {/* 8. Documents associés */}
      <Section titre="8. Documents associés">
        {data.documents.length === 0 ? (
          <p className="text-[#0b1120]/50 text-sm">-</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={HEAD}>
                <th className="px-3 py-1.5 text-left font-semibold">Référence</th>
                <th className="px-3 py-1.5 text-left font-semibold">Intitulé du document</th>
                <th className="px-3 py-1.5 text-left font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {data.documents.map((doc, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: rendu statique
                <tr key={`${doc.intitule}-${i}`} className="border-b align-top">
                  <td className="px-3 py-2">{doc.reference ?? "-"}</td>
                  <td className="px-3 py-2">{doc.intitule}</td>
                  <td className="px-3 py-2">{doc.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* 9. Historique et validation */}
      <Section titre="9. Historique des révisions et validation">
        <table className="mb-4 w-full border-collapse text-sm">
          <thead>
            <tr style={HEAD}>
              <th className="px-3 py-1.5 text-left font-semibold">Version</th>
              <th className="px-3 py-1.5 text-left font-semibold">Date</th>
              <th className="px-3 py-1.5 text-left font-semibold">Nature</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b align-top">
              <td className="px-3 py-2">{data.version ?? "Projet"}</td>
              <td className="px-3 py-2">{data.approuveeLe ? formatDate(data.approuveeLe) : "-"}</td>
              <td className="px-3 py-2">{data.noteRevision ?? "Création de la fiche"}</td>
            </tr>
          </tbody>
        </table>
        <div className="grid grid-cols-3 overflow-hidden rounded-md border text-sm">
          {(
            [
              ["Rédigé par", data.redacteur],
              ["Vérifié par", data.verificateur],
              [
                "Approuvé par",
                data.approbateur
                  ? `${data.approbateur}${data.approuveeLe ? ` · ${formatDate(data.approuveeLe)}` : ""} · signé`
                  : null,
              ],
            ] as [string, string | null][]
          ).map(([label, value], i) => (
            <div key={label} className={i > 0 ? "border-l" : ""}>
              <div className="px-3 py-1.5 font-semibold" style={HEAD}>
                {label}
              </div>
              <div className="min-h-16 px-3 py-2">{value ?? "-"}</div>
            </div>
          ))}
        </div>
      </Section>
    </DocumentPaper>
  );
}
