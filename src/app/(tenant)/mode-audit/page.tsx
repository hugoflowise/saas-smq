import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ISO_ANNEXE_SL } from "@/lib/modules";
import { getNormesActives } from "@/lib/normes-actives";
import { getTenantContext } from "@/lib/tenant-context";
import { IsoAuditView } from "./iso-audit-view";
import { MaseAuditView } from "./mase-audit-view";
import { PrintButton } from "./print-button";

export default async function ModeAuditPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Mode audit" description="Dossier de préparation à l'audit." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const tid = ctx.effectiveTenantId;
  const normes = await getNormesActives();
  const hasIso = ISO_ANNEXE_SL.some((n) => normes.includes(n));
  const hasMase = normes.includes("MASE");
  // Par défaut (aucune norme reconnue) : on garde le dossier ISO 9001 historique.
  const afficherIso = hasIso || !hasMase;

  return (
    <div className="w-full">
      <PageHeader
        title="Mode audit"
        description="Dossier de préparation à l'audit, organisé par référentiel."
        concept="referentiels"
        help="Vue de synthèse présentable à un auditeur. Pour ISO 9001, l'état des éléments de preuve par chapitre de la norme. Pour MASE, le score de l'auto-diagnostic par axe. Cliquez un élément pour ouvrir le module concerné. Bouton Imprimer pour un dossier PDF."
      >
        <PrintButton />
      </PageHeader>

      {hasMase ? <MaseAuditView tenantId={tid} /> : null}
      {afficherIso ? <IsoAuditView tenantId={tid} /> : null}
    </div>
  );
}
