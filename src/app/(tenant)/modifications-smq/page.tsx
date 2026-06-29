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
import { deleteModificationSmqAction } from "@/lib/actions/modifications-smq";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { ModificationDialog } from "./modification-dialog";

const STATUT_LABELS: Record<string, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  realisee: "Réalisée",
  abandonnee: "Abandonnée",
};
const STATUT_CLASS: Record<string, string> = {
  planifiee: "bg-status-pa/15 text-status-pa",
  en_cours: "bg-status-nc-mineure/15 text-status-nc-mineure",
  realisee: "bg-status-conforme/15 text-status-conforme",
  abandonnee: "bg-muted text-muted-foreground",
};

export default async function ModificationsSmqPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Modifications du SMQ"
          description="Planification des modifications du système de management de la qualité."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const today = todayISO();
  const [{ data: modifications }, { data: profils }] = await Promise.all([
    supabase
      .from("modifications_smq")
      .select(
        "id, objet, finalite, consequences, ressources, responsable_id, date_prevue, date_realisee, statut, commentaire",
      )
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("date_prevue", { ascending: true, nullsFirst: false }),
    supabase.from("profiles").select("id, full_name, email").eq("tenant_id", ctx.effectiveTenantId),
  ]);

  const items = modifications ?? [];
  const membres = (profils ?? []).map((p) => ({
    id: p.id,
    label: p.full_name?.trim() || p.email,
  }));
  const noms = new Map(membres.map((m) => [m.id, m.label]));

  const planifiees = items.filter((m) => m.statut === "planifiee").length;
  const enCours = items.filter((m) => m.statut === "en_cours").length;
  const realisees = items.filter((m) => m.statut === "realisee").length;
  const enRetard = items.filter(
    (m) =>
      (m.statut === "planifiee" || m.statut === "en_cours") &&
      m.date_prevue != null &&
      m.date_prevue < today,
  ).length;

  const tiles = [
    { label: "Planifiées", value: planifiees, cls: "text-status-pa" },
    { label: "En cours", value: enCours, cls: "text-status-nc-mineure" },
    { label: "Réalisées", value: realisees, cls: "text-status-conforme" },
    { label: "En retard", value: enRetard, cls: "text-status-nc-majeure" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Modifications du SMQ"
        description="Planifiez les modifications du système de management de la qualité."
        isoClause="ISO 9001 §6.3"
        help="Lorsqu'un besoin de modification du SMQ est identifié (réorganisation, nouveau site, changement d'outil, évolution de processus…), il doit être réalisé de façon planifiée : finalité, conséquences potentielles sur l'intégrité du SMQ, ressources nécessaires et responsabilités."
      >
        <ModificationDialog membres={membres} />
      </PageHeader>

      {items.length > 0 ? <StatTiles tiles={tiles} className="mb-6" /> : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aucune modification planifiée"
          description="Recensez les modifications du SMQ et planifiez-les : finalité, conséquences, ressources et responsabilités."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objet</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Date réalisée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <ModificationDialog
                      modification={m}
                      membres={membres}
                      trigger={
                        <button type="button" className={ROW_NAME_BUTTON}>
                          {m.objet}
                        </button>
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.responsable_id ? (noms.get(m.responsable_id) ?? "-") : "-"}
                  </TableCell>
                  <TableCell>{formatDate(m.date_prevue)}</TableCell>
                  <TableCell>{formatDate(m.date_realisee)}</TableCell>
                  <TableCell>
                    <span className={`${BADGE_BASE} ${STATUT_CLASS[m.statut] ?? "bg-muted"}`}>
                      {STATUT_LABELS[m.statut] ?? m.statut}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SupprimerButton
                      action={deleteModificationSmqAction}
                      id={m.id}
                      libelle="cette modification"
                      iconOnly
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
