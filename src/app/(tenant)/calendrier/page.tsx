import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { type CalEvent, CalendrierClient } from "./calendrier-client";

export default async function CalendrierPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
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

  const [audits, revues, actions, ros] = await Promise.all([
    supabase
      .from("audits_internes")
      .select("id, reference, perimetre, date_prevue")
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
  ]);

  const events: CalEvent[] = [];
  for (const a of audits.data ?? []) {
    events.push({
      date: a.date_prevue as string,
      label: `Audit interne — ${a.perimetre ?? a.reference}`,
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
      label: `${a.reference} — ${a.description_courte}`,
      type: "Action",
      href: "/actions",
    });
  }
  for (const r of ros.data ?? []) {
    events.push({
      date: r.date_revue as string,
      label: `Revue R&O — ${r.intitule}`,
      type: "R&O",
      href: "/risques",
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Calendrier qualité"
        description="Échéances et événements agrégés (audits, revues, actions, R&O)."
      />

      {events.length === 0 ? (
        <EmptyState
          title="Aucune échéance"
          description="Les dates planifiées dans les audits, revues, actions et R&O apparaîtront ici."
        />
      ) : (
        <CalendrierClient events={events} />
      )}
    </div>
  );
}
