import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { charteColors } from "@/components/document-paper";
import { FicheProcessus } from "@/components/fiche-processus";
import { PrintButton } from "@/components/print-button";
import { loadFicheProcessusData } from "@/lib/fiche-processus-data";
import { formatDate } from "@/lib/format";
import { getTenantContext } from "@/lib/tenant-context";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
};

export default async function FicheProcessusPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return <p className="p-8 text-sm">Aucun client sélectionné.</p>;
  }

  const fiche = await loadFicheProcessusData(ctx.effectiveTenantId, id);
  if (!fiche) {
    return <p className="p-8 text-sm">Processus introuvable.</p>;
  }

  const { data } = fiche;
  const { charte, contrast, teinte } = charteColors(data.societe.couleur_charte);
  const versionValue =
    data.version && data.versionDate
      ? `${data.version} - ${formatDate(data.versionDate)}`
      : `Projet (${STATUT_LABELS[data.statut] ?? data.statut})`;
  const reference = data.reference?.trim() || "-";

  return (
    <div className="min-h-full bg-surface print:bg-white">
      {/*
        Impression A4 : le document est enveloppé dans un <table> dont le <thead>
        se répète automatiquement en haut de chaque feuille (seule méthode fiable
        multi-navigateurs) et réserve sa hauteur. L'en-tête de DocumentPaper est
        masqué à l'impression (hideHeaderOnPrint) pour laisser place à ce bandeau
        répété. Numérotation des feuilles via l'option du navigateur.
      */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          .doc-page { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
          tr { break-inside: avoid; }
          h2 { break-after: avoid; }
          .fiche-print-table { width: 100%; border-collapse: collapse; }
          .fiche-print-bande { display: table-header-group; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-2 border-b bg-card px-6 py-3 print:hidden">
        <Link
          href={`/processus/${id}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour au processus
        </Link>
        <PrintButton />
      </div>

      <div className="my-8 print:my-0">
        <table className="fiche-print-table">
          {/* En-tête répété sur chaque feuille à l'impression (masqué à l'écran). */}
          <thead className="fiche-print-bande hidden">
            <tr>
              <td className="pb-4">
                <div className="mx-auto flex max-w-3xl items-stretch gap-3">
                  <div
                    className="flex min-w-0 flex-1 flex-col justify-center rounded-md px-4 py-3"
                    style={{ backgroundColor: charte, color: contrast }}
                  >
                    <p className="font-semibold text-sm uppercase tracking-[0.08em]">
                      Fiche d'identité du processus
                    </p>
                    <p className="mt-0.5 text-sm italic opacity-90">{data.nom}</p>
                  </div>
                  <div
                    className="w-64 shrink-0 overflow-hidden rounded-md border text-xs"
                    style={{ borderColor: teinte(0.35) }}
                  >
                    {[
                      { label: "Référence", value: reference },
                      { label: "Version / Date", value: versionValue },
                    ].map((m) => (
                      <div key={m.label} className="flex border-b last:border-b-0">
                        <span
                          className="w-24 shrink-0 px-2 py-1.5 font-semibold"
                          style={{ backgroundColor: teinte(0.12), color: teinte(0.95) }}
                        >
                          {m.label}
                        </span>
                        <span className="px-2 py-1.5">{m.value}</span>
                      </div>
                    ))}
                  </div>
                  {data.societe.logo_url ? (
                    // biome-ignore lint/performance/noImgElement: logo client, document imprimable
                    <img
                      src={data.societe.logo_url}
                      alt={data.societe.nom_societe}
                      className="h-16 w-auto shrink-0 self-start object-contain"
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <FicheProcessus {...data} hideHeaderOnPrint />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
