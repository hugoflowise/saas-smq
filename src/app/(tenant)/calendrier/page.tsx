import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadCalendarEvents } from "@/lib/calendrier";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CalendrierClient } from "./calendrier-client";
import { CertificationTab } from "./certification-tab";
import { EvenementDelete } from "./evenement-delete";
import { EvenementDialog } from "./evenement-dialog";
import type { JalonRow } from "./jalon-dialog";
import { PlanifierMenu } from "./planifier-menu";

export default async function CalendrierPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Planning qualité"
          description="Événements, échéances et certification."
        />
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

  const supabase = await createClient();
  const [{ data: manuels }, { data: jalons }] = await Promise.all([
    supabase
      .from("evenements_qualite")
      .select("id, titre, date_evenement")
      .eq("tenant_id", tid)
      .order("date_evenement", { ascending: false }),
    supabase
      .from("jalons_certification")
      .select("id, libelle, type, date_jalon, statut, description")
      .eq("tenant_id", tid)
      .order("date_jalon", { ascending: true, nullsFirst: false }),
  ]);
  const manuelsList = manuels ?? [];
  const jalonsList = (jalons ?? []) as JalonRow[];

  return (
    <div className="w-full">
      <PageHeader
        title="Planning qualité"
        description="Échéances agrégées (audits, revues, actions, R&O, communications, réunions, révisions) et cycle de certification."
        help="Vue consolidée des échéances de tous les modules. Les audits, revues, réunions, actions… se créent dans leur module (bouton « Planifier ») et apparaissent ici automatiquement. L'onglet « Cycle de certification » pilote les jalons (audit blanc, certification, surveillances)."
      />

      <Tabs defaultValue="calendrier">
        <TabsList>
          <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
          <TabsTrigger value="certification">
            Cycle de certification{jalonsList.length > 0 ? ` (${jalonsList.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendrier">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <PlanifierMenu />
            <EvenementDialog />
          </div>

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
        </TabsContent>

        <TabsContent value="certification">
          <CertificationTab jalons={jalonsList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
