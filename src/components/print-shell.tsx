import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DocumentPaper, type Societe } from "@/components/document-paper";
import { PrintButton } from "@/components/print-button";

export type { Societe };

/**
 * Mise en page d'un document officiel imprimable : barre d'action (masquée à
 * l'impression) + feuille de document (DocumentPaper).
 */
export function PrintShell({
  backHref,
  surtitre,
  titre,
  societe,
  meta,
  genereLe,
  children,
}: {
  backHref: string;
  surtitre?: string;
  titre: string;
  societe: Societe;
  meta?: { label: string; value: string }[];
  genereLe?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-surface print:bg-white">
      <style>{`@media print { @page { margin: 16mm; } .doc-page { box-shadow: none !important; } }`}</style>

      <div className="flex items-center justify-between gap-2 border-b bg-card px-6 py-3 print:hidden">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Link>
        <PrintButton />
      </div>

      <DocumentPaper
        surtitre={surtitre}
        titre={titre}
        societe={societe}
        meta={meta}
        genereLe={genereLe}
        className="my-8 print:my-0 print:max-w-none print:p-0"
      >
        {children}
      </DocumentPaper>
    </div>
  );
}
