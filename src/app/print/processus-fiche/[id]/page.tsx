import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FicheProcessus } from "@/components/fiche-processus";
import { PrintButton } from "@/components/print-button";
import { loadFicheProcessusData } from "@/lib/fiche-processus-data";
import { getTenantContext } from "@/lib/tenant-context";

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

  return (
    <div className="min-h-full bg-surface print:bg-white">
      {/*
        Impression A4 : on enveloppe le document dans un <table> dont le <thead>
        se répète automatiquement en haut de chaque feuille (seule méthode fiable
        et multi-navigateurs pour un en-tête récurrent) et réserve sa hauteur.
        Les sauts de page évitent de couper les lignes de tableau. La numérotation
        des feuilles est fournie par l'option « En-têtes et pieds de page » du
        navigateur à l'impression.
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
              <td className="pb-3">
                <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-3 border-[#0b1120]/15 border-b pb-1.5 text-[10px] text-[#0b1120]/60">
                  <span className="font-medium">{fiche.data.societe.nom_societe}</span>
                  <span className="italic">Fiche d'identité du processus : {fiche.data.nom}</span>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <FicheProcessus {...fiche.data} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
