import { formatDate } from "@/lib/format";

/**
 * Tableau de révision en tête de procédure (habitude client) : une ligne par
 * version publiée, avec l'indice, la date + l'objet de la modification, et le
 * trio de signataires (rédacteur / vérificateur / approbateur) avec leur visa.
 *
 * S'appuie sur les variables CSS `--charte` / `--charte-contrast` : doit donc
 * être rendu à l'intérieur d'un `DocumentPaper`.
 */
export type RevisionLigne = {
  id: string;
  version: string | null;
  approvedAt: string | null;
  noteRevision: string | null;
  redacteur: string | null;
  redacteurSignature: string | null;
  verificateur: string | null;
  verificateurSignature: string | null;
  approverName: string | null;
  approverSignature: string | null;
};

const HEAD: React.CSSProperties = {
  backgroundColor: "var(--charte)",
  color: "var(--charte-contrast)",
};

/** Cellule « Fonction : Nom » avec visa (image de signature) si disponible. */
function Visa({
  fonction,
  nom,
  signature,
}: {
  fonction: string;
  nom: string | null;
  signature: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span>
        <span className="font-medium">{fonction} :</span> {nom?.trim() ? nom : "-"}
      </span>
      {signature ? (
        // biome-ignore lint/performance/noImgElement: signature (data URL), document imprimable
        <img src={signature} alt={`Visa ${fonction}`} className="h-10 w-auto object-contain" />
      ) : null}
    </div>
  );
}

export function ProcedureRevisionTable({ versions }: { versions: RevisionLigne[] }) {
  if (versions.length === 0) return null;
  // Ordre chronologique croissant (A, B, C…) : le tableau de révision se lit du
  // plus ancien au plus récent.
  const lignes = [...versions].reverse();
  return (
    <section className="mb-6">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={HEAD}>
            <th className="w-16 border px-3 py-1.5 text-left font-semibold">Indice</th>
            <th className="border px-3 py-1.5 text-left font-semibold">
              Date, Objet de la modification
            </th>
            <th className="border px-3 py-1.5 text-left font-semibold">
              Fonction, Nom et Visa du Rédacteur, Vérificateur et Approbateur
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((v) => (
            <tr key={v.id} className="align-top">
              <td className="border px-3 py-2 font-medium">{v.version?.trim() || "-"}</td>
              <td className="border px-3 py-2">
                <p className="font-medium">{formatDate(v.approvedAt)}</p>
                <p className="mt-0.5 whitespace-pre-wrap">
                  {v.noteRevision?.trim() ? v.noteRevision : "-"}
                </p>
              </td>
              <td className="border px-3 py-2">
                <div className="flex flex-col gap-2">
                  <Visa fonction="Rédacteur" nom={v.redacteur} signature={v.redacteurSignature} />
                  <Visa
                    fonction="Vérificateur"
                    nom={v.verificateur}
                    signature={v.verificateurSignature}
                  />
                  <Visa
                    fonction="Approbateur"
                    nom={v.approverName}
                    signature={v.approverSignature}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
