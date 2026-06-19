import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { AUDIT_TYPE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { type CalEvent, CalendrierClient } from "./calendrier-client";
import { EvenementDelete } from "./evenement-delete";
import { EvenementDialog } from "./evenement-dialog";

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

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const [audits, revues, actions, ros, communications, jalons, evenements] = await Promise.all([
    supabase
      .from("audits_internes")
      .select("id, reference, type_audit, perimetre, organisme, date_prevue")
      .eq("tenant_id", tid)
      .not("date_prevue", "is", null),
    supabase
      .from("revues_direction")
      .select("id, annee, date_realisation")
      .eq("tenant_id", tid)
      .not("date_realisation", "is", null),
    supabase
      .from("actions")
      .select("id, reference, description_courte, date_prevue")
      .eq("tenant_id", tid)
      .in("statut", ["a_faire", "en_cours", "bloquee"] as ("a_faire" | "en_cours" | "bloquee")[])
      .not("date_prevue", "is", null),
    supabase
      .from("risques_opportunites")
      .select("id, intitule, date_revue")
      .eq("tenant_id", tid)
      .not("date_revue", "is", null),
    supabase
      .from("communications")
      .select("id, sujet, date_prevue")
      .eq("tenant_id", tid)
      .not("date_prevue", "is", null),
    supabase
      .from("jalons_certification")
      .select("id, libelle, date_jalon")
      .eq("tenant_id", tid)
      .not("date_jalon", "is", null),
    supabase
      .from("evenements_qualite")
      .select("id, titre, date_evenement")
      .eq("tenant_id", tid)
      .order("date_evenement", { ascending: false }),
  ]);

  const events: CalEvent[] = [];
  for (const a of audits.data ?? []) {
    events.push({
      date: a.date_prevue as string,
      label: `Audit ${AUDIT_TYPE_LABELS[a.type_audit as keyof typeof AUDIT_TYPE_LABELS]?.toLowerCase() ?? ""} · ${a.perimetre ?? a.organisme ?? a.reference}`,
      type: "Audit",
      href: `/audits/${a.id}`,
    });
  }
  for (const r of revues.data ?? []) {
    events.push({
      date: r.date_realisation as string,
      label: `Revue de direction ${r.annee}`,
      type: "Revue",
      href: "/revues/direction",
    });
  }
  for (const a of actions.data ?? []) {
    events.push({
      date: a.date_prevue as string,
      label: `${a.reference} · ${a.description_courte}`,
      type: "Action",
      href: `/actions/${a.id}`,
    });
  }
  for (const r of ros.data ?? []) {
    events.push({
      date: r.date_revue as string,
      label: `Revue R&O · ${r.intitule}`,
      type: "R&O",
      href: "/risques",
    });
  }
  for (const c of communications.data ?? []) {
    events.push({
      date: c.date_prevue as string,
      label: c.sujet,
      type: "Communication",
      href: "/communications",
    });
  }
  for (const j of jalons.data ?? []) {
    events.push({
      date: j.date_jalon as string,
      label: j.libelle,
      type: "Certification",
      href: "/certification",
    });
  }
  const manuels = evenements.data ?? [];
  for (const e of manuels) {
    events.push({
      date: e.date_evenement,
      label: e.titre,
      type: "Événement",
      href: "/calendrier",
    });
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Calendrier qualité"
        description="Échéances et événements agrégés : audits, revues, actions, R&O, communications, certification."
        help="Vue consolidée des échéances de tous les modules. Filtrez par type d'événement (couleurs) et basculez entre vue mois et liste. D'autres types (formations, EPI, habilitations, visites médicales…) viendront avec les données Boond."
      >
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

      {manuels.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Événements ajoutés manuellement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {manuels.map((e) => (
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
