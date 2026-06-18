"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CalEvent = { date: string; label: string; type: string; href: string };

const TYPE_DOT: Record<string, string> = {
  Audit: "bg-status-pf",
  Revue: "bg-primary",
  Action: "bg-status-pa",
  "R&O": "bg-status-nc-majeure",
};

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
  });
}

function EventRow({ e }: { e: CalEvent }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <Link href={e.href} className="flex min-w-0 items-center gap-2.5 text-sm hover:text-primary">
        <span
          className={`size-2.5 shrink-0 rounded-full ${TYPE_DOT[e.type] ?? "bg-muted-foreground"}`}
        />
        <span className="truncate">{e.label}</span>
      </Link>
      <span className="shrink-0 text-muted-foreground text-xs">{formatDate(e.date)}</span>
    </li>
  );
}

function MonthView({ events }: { events: CalEvent[] }) {
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

  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold capitalize">
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

      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((j) => (
          <div key={j} className="pb-1 text-center font-medium text-muted-foreground text-xs">
            {j}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            // biome-ignore lint/suspicious/noArrayIndexKey: cellules vides de remplissage
            return <div key={`empty-${i}`} className="min-h-20 rounded-md" />;
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayEvents = byDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              className={`min-h-20 rounded-md border p-1 ${isToday ? "border-primary bg-primary/5" : "bg-card"}`}
            >
              <p
                className={`text-right text-xs ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}
              >
                {day}
              </p>
              <div className="mt-0.5 flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e, j) => (
                  <Link
                    // biome-ignore lint/suspicious/noArrayIndexKey: events d'un même jour
                    key={`${dateStr}-${j}`}
                    href={e.href}
                    title={e.label}
                    className="flex items-center gap-1 truncate rounded bg-surface px-1 py-0.5 text-[10px] hover:bg-muted"
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${TYPE_DOT[e.type] ?? "bg-muted-foreground"}`}
                    />
                    <span className="truncate">{e.label}</span>
                  </Link>
                ))}
                {dayEvents.length > 3 ? (
                  <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
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
  const [view, setView] = useState<"liste" | "mois">("liste");
  const today = new Date().toISOString().slice(0, 10);
  const passe = events.filter((e) => e.date < today).sort((a, b) => a.date.localeCompare(b.date));
  const aVenir = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 self-start rounded-lg border bg-card p-0.5">
        <Button
          variant={view === "liste" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("liste")}
        >
          Liste
        </Button>
        <Button
          variant={view === "mois" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("mois")}
        >
          Mois
        </Button>
      </div>

      {view === "mois" ? (
        <Card>
          <CardContent className="pt-6">
            <MonthView events={events} />
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
