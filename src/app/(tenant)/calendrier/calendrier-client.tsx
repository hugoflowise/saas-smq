"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIMEZONE, todayISO } from "@/lib/format";

export type CalEvent = { date: string; label: string; type: string; href: string };

// Couleurs par type d'événement (classes littérales pour Tailwind).
const TYPE_META: Record<string, { dot: string; chip: string }> = {
  Audit: { dot: "bg-status-pf", chip: "bg-status-pf/15 text-status-pf" },
  Revue: { dot: "bg-primary", chip: "bg-primary/15 text-primary" },
  Action: { dot: "bg-status-pa", chip: "bg-status-pa/15 text-status-pa" },
  "R&O": { dot: "bg-status-nc-majeure", chip: "bg-status-nc-majeure/15 text-status-nc-majeure" },
  Communication: { dot: "bg-status-conforme", chip: "bg-status-conforme/15 text-status-conforme" },
  Certification: {
    dot: "bg-status-nc-mineure",
    chip: "bg-status-nc-mineure/15 text-status-nc-mineure",
  },
  Réunion: { dot: "bg-violet-500", chip: "bg-violet-500/15 text-violet-600" },
  Document: { dot: "bg-sky-500", chip: "bg-sky-500/15 text-sky-700" },
  Événement: { dot: "bg-foreground/50", chip: "bg-foreground/10 text-foreground" },
};
const META_DEFAUT = { dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground" };
const meta = (type: string) => TYPE_META[type] ?? META_DEFAUT;

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

function EventRow({ e }: { e: CalEvent }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <Link href={e.href} className="flex min-w-0 items-center gap-2.5 text-sm hover:text-primary">
        <span
          className={`inline-flex shrink-0 rounded-full px-2 py-0.5 font-medium text-xs ${meta(e.type).chip}`}
        >
          {e.type}
        </span>
        <span className="truncate">{e.label}</span>
      </Link>
      <span className="shrink-0 text-muted-foreground text-xs">{formatDate(e.date)}</span>
    </li>
  );
}

export function MonthView({ events }: { events: CalEvent[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const byDate = new Map<string, CalEvent[]>();
  for (const e of events) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-lg capitalize">
          {MOIS[month]} {year}
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mois précédent"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Mois suivant"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {JOURS.map((j) => (
          <div key={j} className="pb-1 text-center font-medium text-muted-foreground text-xs">
            {j}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            // biome-ignore lint/suspicious/noArrayIndexKey: cellules vides de remplissage
            return <div key={`empty-${i}`} className="min-h-28 rounded-xl" />;
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayEvents = byDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              className={`flex min-h-28 flex-col rounded-xl border p-1.5 ${
                isToday ? "border-primary ring-1 ring-primary/30" : "bg-card"
              }`}
            >
              <span
                className={`mb-1 flex size-6 items-center justify-center self-end rounded-full text-xs ${
                  isToday
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {day}
              </span>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 4).map((e, j) => (
                  <Link
                    // biome-ignore lint/suspicious/noArrayIndexKey: events d'un même jour
                    key={`${dateStr}-${j}`}
                    href={e.href}
                    title={`${e.type} · ${e.label}`}
                    className={`truncate rounded-md px-1.5 py-0.5 font-medium text-[11px] transition-opacity hover:opacity-80 ${meta(e.type).chip}`}
                  >
                    {e.label}
                  </Link>
                ))}
                {dayEvents.length > 4 ? (
                  <span className="px-1 text-[10px] text-muted-foreground">
                    +{dayEvents.length - 4} autre(s)
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendrierClient({ events }: { events: CalEvent[] }) {
  const [view, setView] = useState<"mois" | "liste">("mois");
  const today = todayISO();

  const types = useMemo(() => [...new Set(events.map((e) => e.type))].sort(), [events]);
  const [actifs, setActifs] = useState<Set<string>>(() => new Set(types));

  const filtres = events.filter((e) => actifs.has(e.type));
  const passe = filtres.filter((e) => e.date < today).sort((a, b) => a.date.localeCompare(b.date));
  const aVenir = filtres
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  function toggle(type: string) {
    setActifs((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {types.map((type) => {
            const on = actifs.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggle(type)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  on ? "bg-card" : "bg-transparent text-muted-foreground opacity-60"
                }`}
              >
                <span className={`size-2 rounded-full ${meta(type).dot}`} />
                {type}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 rounded-lg border bg-card p-0.5">
          <Button
            variant={view === "mois" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("mois")}
          >
            Mois
          </Button>
          <Button
            variant={view === "liste" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("liste")}
          >
            Liste
          </Button>
        </div>
      </div>

      {view === "mois" ? (
        <Card>
          <CardContent className="pt-6">
            <MonthView events={filtres} />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {passe.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Passées ({passe.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {passe.map((e, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: agrégat sans id stable
                    <EventRow key={`p-${e.href}-${e.date}-${i}`} e={e} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">À venir ({aVenir.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {aVenir.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune échéance à venir.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {aVenir.map((e, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: agrégat sans id stable
                    <EventRow key={`a-${e.href}-${e.date}-${i}`} e={e} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
