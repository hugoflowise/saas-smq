import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCalendarEvents } from "@/lib/calendrier";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CalendrierClient } from "./calendrier-client";
import { EvenementDelete } from "./evenement-delete";
import { EvenementDialog } from "./evenement-dialog";
import { PlanifierMenu } from "./planifier-menu";

export default async function CalendrierPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Calendrier qualité" description="Événements et échéances qualité." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const tid = ctx.effectiveTenantId;
  // Source unique des échéances (partagée avec l'aperçu du tableau de bord).
  const events = await loadCalendarEvents(tid);

  // Liste des événements ajoutés manuellement (avec id, pour la suppression).
  const supabase = await createClient();
  const { data: manuels } = await supabase
    .from("evenements_qualite")
    .select("id, titre, date_evenement")
    .eq("tenant_id", tid)
    .order("date_evenement", { ascending: false });
  const manuelsList = manuels ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Calendrier qualité"
        description="Échéances et événements agrégés : audits, revues, actions, R&O, communications, certification, réunions, révisions de documents."
        help="Vue consolidée des échéances de tous les modules. Les audits, revues, réunions, actions… se créent dans leur module (bouton « Planifier ») et apparaissent ici automatiquement. « Autre événement » sert aux dates ponctuelles sans module dédié. Filtrez par type (couleurs), basculez entre vue mois et liste."
      >
        <PlanifierMenu />
        <EvenementDialog />
      </PageHeader>

      {events.length === 0 ? (
        <EmptyState
          title="Aucune échéance"
          description="Ajoutez un événement, ou planifiez des dates dans les audits, revues, actions, etc."
        />
      ) : (
        <CalendrierClient events={events} />
      )}

      {manuelsList.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Événements ajoutés manuellement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {manuelsList.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{e.titre}</span>{" "}
                    <span className="text-muted-foreground text-xs">
                      {formatDate(e.date_evenement)}
                    </span>
                  </span>
                  <EvenementDelete id={e.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
