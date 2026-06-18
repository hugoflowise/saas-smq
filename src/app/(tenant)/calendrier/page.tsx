import type { LucideIcon } from "lucide-react";
import { CalendarDays, ClipboardCheck, ListChecks, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type Event = { date: string; label: string; type: string; href: string; icon: LucideIcon };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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

  const events: Event[] = [];
  for (const a of audits.data ?? []) {
    events.push({
      date: a.date_prevue as string,
      label: `Audit interne — ${a.perimetre ?? a.reference}`,
      type: "Audit",
      href: `/audits/${a.id}`,
      icon: ClipboardCheck,
    });
  }
  for (const r of revues.data ?? []) {
    events.push({
      date: r.date_realisation as string,
      label: `Revue de direction ${r.annee}`,
      type: "Revue",
      href: "/revues/direction",
      icon: CalendarDays,
    });
  }
  for (const a of actions.data ?? []) {
    events.push({
      date: a.date_prevue as string,
      label: `${a.reference} — ${a.description_courte}`,
      type: "Action",
      href: "/actions",
      icon: ListChecks,
    });
  }
  for (const r of ros.data ?? []) {
    events.push({
      date: r.date_revue as string,
      label: `Revue R&O — ${r.intitule}`,
      type: "R&O",
      href: "/risques",
      icon: ShieldCheck,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const aVenir = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const passe = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  function renderList(list: Event[]) {
    return (
      <ul className="flex flex-col divide-y">
        {list.map((e, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: agrégat sans id unique stable
            key={`${e.href}-${e.date}-${i}`}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <Link
              href={e.href}
              className="flex min-w-0 items-center gap-2.5 text-sm hover:text-primary"
            >
              <e.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{e.label}</span>
            </Link>
            <span className="shrink-0 text-muted-foreground text-xs">{formatDate(e.date)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
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
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">À venir ({aVenir.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {aVenir.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune échéance à venir.</p>
              ) : (
                renderList(aVenir)
              )}
            </CardContent>
          </Card>

          {passe.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Passées ({passe.length})
                </CardTitle>
              </CardHeader>
              <CardContent>{renderList(passe)}</CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
