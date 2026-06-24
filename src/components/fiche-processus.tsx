import { DocumentPaper, type Societe } from "@/components/document-paper";
import { formatDate } from "@/lib/format";

export type FicheActivite = {
  activite: string;
  responsable: string | null;
  documents: string | null;
};
export type FicheInteraction = { fournisseur: string; nature: string | null; client: string };
export type FicheIndicateur = {
  nom: string;
  cible: string;
  formule: string | null;
  frequence: string | null;
};
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
  ressources: { type: string; detail: string | null }[];
  activites: FicheActivite[];
  interactions: FicheInteraction[];
  indicateurs: FicheIndicateur[];
  risques: FicheRisque[];
  opportunites: FicheRisque[];
  documents: FicheDocument[];
  reference: string | null;
  statut: string;
  version: string | null;
  versionDate: string | null;
  redacteur: string | null;
  verificateur: string | null;
  approbateur: string | null;
  signatureApprobateur?: string | null;
  approuveeLe: string | null;
  genereLe?: string;
  /** Masque l'en-tête à l'impression (en-tête répété fourni par la page d'impression). */
  hideHeaderOnPrint?: boolean;
};

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
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
  const versionValue =
    data.version && data.versionDate
      ? `${data.version} - ${formatDate(data.versionDate)}`
      : `Projet (${STATUT_LABELS[data.statut] ?? data.statut})`;
  const meta = [
    { label: "Référence", value: data.reference?.trim() || "-" },
    { label: "Version / Date", value: versionValue },
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
      hideHeaderOnPrint={data.hideHeaderOnPrint}
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
                <tr key={`${it.fournisseur}-${it.client}-${i}`} className="border-b align-top">
                  <td className="px-3 py-2">{it.fournisseur?.trim() || "-"}</td>
                  <td className="px-3 py-2">{it.nature ?? "-"}</td>
                  <td className="px-3 py-2">{it.client?.trim() || "-"}</td>
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
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={HEAD}>
              <th className="w-44 px-3 py-1.5 text-left font-semibold">Type de ressource</th>
              <th className="px-3 py-1.5 text-left font-semibold">Détail</th>
            </tr>
          </thead>
          <tbody>
            {data.ressources.map((r) => (
              <tr key={r.type} className="border-b align-top">
                <th
                  className="px-3 py-2 text-left font-semibold"
                  style={{ backgroundColor: "color-mix(in srgb, var(--charte) 10%, white)" }}
                >
                  {r.type}
                </th>
                <td className="whitespace-pre-wrap px-3 py-2">{r.detail?.trim() || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <th className="px-3 py-1.5 text-left font-semibold">Formule / mode de calcul</th>
                <th className="px-3 py-1.5 text-left font-semibold">Fréquence</th>
                <th className="px-3 py-1.5 text-left font-semibold">Objectif / cible</th>
              </tr>
            </thead>
            <tbody>
              {data.indicateurs.map((ind) => (
                <tr key={ind.nom} className="border-b align-top">
                  <td className="px-3 py-2">{ind.nom}</td>
                  <td className="whitespace-pre-wrap px-3 py-2">{ind.formule?.trim() || "-"}</td>
                  <td className="px-3 py-2">{ind.frequence ?? "-"}</td>
                  <td className="px-3 py-2">{ind.cible}</td>
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
              <th className="px-3 py-1.5 text-left font-semibold">Nature de la modification</th>
              <th className="px-3 py-1.5 text-left font-semibold">Rédacteur</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b align-top">
              <td className="px-3 py-2">{data.version ?? "Projet"}</td>
              <td className="px-3 py-2">{data.versionDate ? formatDate(data.versionDate) : "-"}</td>
              <td className="px-3 py-2">
                {data.version ? "Version publiée" : "Création de la fiche"}
              </td>
              <td className="px-3 py-2">{data.redacteur?.trim() || "-"}</td>
            </tr>
          </tbody>
        </table>
        <div className="grid grid-cols-2 overflow-hidden rounded-md border text-sm">
          {(
            [
              { label: "Rédigé par", nom: data.redacteur, date: null, signe: false, image: null },
              {
                label: "Approuvé par",
                nom: data.approbateur,
                date: data.approuveeLe,
                signe: Boolean(data.approbateur),
                image: data.signatureApprobateur ?? null,
              },
            ] as {
              label: string;
              nom: string | null;
              date: string | null;
              signe: boolean;
              image: string | null;
            }[]
          ).map((c, i) => (
            <div key={c.label} className={i > 0 ? "border-l" : ""}>
              <div className="px-3 py-1.5 font-semibold" style={HEAD}>
                {c.label}
              </div>
              <div className="flex min-h-24 flex-col px-3 py-2">
                <p className="font-medium">{c.nom?.trim() ? c.nom : "-"}</p>
                {c.signe && c.image ? (
                  // biome-ignore lint/performance/noImgElement: signature (data URL), document imprimable
                  <img src={c.image} alt="Signature" className="mt-1 h-12 w-auto object-contain" />
                ) : null}
                {c.signe ? (
                  <p className="mt-auto text-xs italic" style={{ color: "var(--charte)" }}>
                    Signé électroniquement{c.date ? ` le ${formatDate(c.date)}` : ""}
                  </p>
                ) : c.label === "Approuvé par" ? (
                  <p className="mt-auto text-[#0b1120]/40 text-xs">En attente d'approbation</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </DocumentPaper>
  );
}
