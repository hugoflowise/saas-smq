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
      <style>{`@media print { @page { margin: 14mm; } .doc-page { box-shadow: none !important; border: none !important; } }`}</style>

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
        <FicheProcessus {...fiche.data} />
      </div>
    </div>
  );
}
