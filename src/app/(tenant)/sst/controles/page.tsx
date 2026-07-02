import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import { SupprimerButton } from "@/components/supprimer-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteControleAction } from "@/lib/actions/controles";
import { BADGE_BASE } from "@/lib/badges";
import {
  CONTROLE_STATUT_CLASS,
  CONTROLE_STATUT_LABELS,
  type ControleStatut,
  joursAvantEcheance,
} from "@/lib/controles";
import { DOMAINE_SSE_LABELS, type DomaineSse } from "@/lib/domaines-sse";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ControleDialog } from "./controle-dialog";

// Fenêtre d'alerte « échéance proche » (jours).
const SEUIL_ALERTE = 60;

export default async function ControlesPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Contrôles obligatoires"
          description="Registre des vérifications réglementaires périodiques et de leurs échéances."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer ses contrôles obligatoires."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: controles } = await supabase
    .from("controles_obligatoires")
    .select(
      "id, intitule, equipement, organisme, domaine, periodicite_mois, date_dernier, date_prochain, statut, reference, observations",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .is("deleted_at", null)
    .order("date_prochain", { ascending: true, nullsFirst: false });

  const items = controles ?? [];
  const today = todayISO();

  const enRetard = items.filter(
    (c) => c.date_prochain != null && joursAvantEcheance(c.date_prochain, today) < 0,
  ).length;
  const bientot = items.filter((c) => {
    if (c.date_prochain == null) return false;
    const j = joursAvantEcheance(c.date_prochain, today);
    return j >= 0 && j <= SEUIL_ALERTE;
  }).length;
  const conformes = items.filter((c) => c.statut === "conforme").length;

  const tiles = [
    { label: "Contrôles", value: items.length, cls: "text-foreground" },
    { label: "Conformes", value: conformes, cls: "text-status-conforme" },
    { label: `Échéance < ${SEUIL_ALERTE} j`, value: bientot, cls: "text-status-pa" },
    { label: "En retard", value: enRetard, cls: "text-status-nc-majeure" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Contrôles obligatoires"
        description="Registre des vérifications réglementaires périodiques et de leurs échéances."
        isoClause="MASE Axe 4"
        help="Recensez les vérifications réglementaires périodiques (levage, électrique, incendie, machines…), leur organisme, leur périodicité et leur prochaine échéance. Les contrôles en retard ou à échéance proche sont mis en évidence."
      >
        <ControleDialog />
      </PageHeader>

      <StatTiles tiles={tiles} className="mb-6" />

      {items.length === 0 ? (
        <EmptyState
          title="Aucun contrôle enregistré"
          description="Ajoutez les vérifications réglementaires périodiques à suivre."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[24%]">Contrôle</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Organisme</TableHead>
                <TableHead>Périodicité</TableHead>
                <TableHead>Dernier</TableHead>
                <TableHead>Prochaine échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => {
                const jours =
                  c.date_prochain != null ? joursAvantEcheance(c.date_prochain, today) : null;
                const echeanceClass =
                  jours == null
                    ? "text-muted-foreground text-xs"
                    : jours < 0
                      ? `${BADGE_BASE} bg-status-nc-majeure/15 text-status-nc-majeure`
                      : jours <= SEUIL_ALERTE
                        ? `${BADGE_BASE} bg-status-pa/15 text-status-pa`
                        : "text-muted-foreground text-sm";
                return (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{c.intitule}</span>
                      {c.equipement ? (
                        <span className="block text-muted-foreground text-xs">{c.equipement}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.domaine ? DOMAINE_SSE_LABELS[c.domaine as DomaineSse] : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.organisme ?? "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {c.periodicite_mois ? `${c.periodicite_mois} mois` : "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {c.date_dernier ? formatDate(c.date_dernier) : "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {c.date_prochain ? (
                        <span className={echeanceClass}>{formatDate(c.date_prochain)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${BADGE_BASE} ${CONTROLE_STATUT_CLASS[c.statut as ControleStatut]}`}
                      >
                        {CONTROLE_STATUT_LABELS[c.statut as ControleStatut]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <ControleDialog controle={c} />
                        <SupprimerButton
                          action={deleteControleAction}
                          id={c.id}
                          libelle="ce contrôle"
                          iconOnly
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
