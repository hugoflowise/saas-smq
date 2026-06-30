import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { StatTiles } from "@/components/stat-tiles";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate, todayISO } from "@/lib/format";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { GenererCycleDialog } from "./generer-cycle-dialog";
import { JalonDelete } from "./jalon-delete";
import { JALON_TYPE_LABELS, JalonDialog, type JalonRow } from "./jalon-dialog";

const TYPE_BADGE: Record<string, string> = {
  audit_interne: "bg-status-pa/15 text-status-pa",
  audit_blanc: "bg-status-pa/15 text-status-pa",
  audit_certification: "bg-status-conforme/15 text-status-conforme",
  audit_surveillance: "bg-status-pf/15 text-status-pf",
  revue: "bg-primary/10 text-primary",
  autre: "bg-muted text-muted-foreground",
};

export function CertificationTab({ jalons }: { jalons: JalonRow[] }) {
  const today = todayISO();

  const planifies = jalons.filter((j) => j.statut === "planifie");
  const realises = jalons.filter((j) => j.statut === "realise");
  const prochain = planifies
    .filter((j) => j.date_jalon != null && j.date_jalon >= today)
    .sort((a, b) => (a.date_jalon ?? "").localeCompare(b.date_jalon ?? ""))[0];
  const certifie = realises.some((j) => j.type === "audit_certification");

  const tiles = [
    {
      label: "Prochain jalon",
      value: prochain ? formatDate(prochain.date_jalon) : "—",
      cls: "text-foreground",
    },
    { label: "Jalons planifiés", value: planifies.length, cls: "text-status-pf" },
    { label: "Réalisés", value: realises.length, cls: "text-status-conforme" },
    {
      label: "Certificat",
      value: certifie ? "Obtenu" : "En cours",
      cls: certifie ? "text-status-conforme" : "text-status-pa",
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Cycle ISO 9001 sur 3 ans : un audit interne 2 mois avant chaque audit de l'organisme
          (certification, surveillances annuelles, renouvellement). Chaque jalon crée l'audit
          correspondant dans le module Audits.
        </p>
        <div className="flex flex-wrap gap-2">
          {jalons.length === 0 ? <GenererCycleDialog /> : null}
          <JalonDialog />
        </div>
      </div>

      {jalons.length === 0 ? (
        <EmptyState
          title="Aucun jalon de certification"
          description="Générez le cycle type sur 3 ans, ou ajoutez vos jalons un à un."
        />
      ) : (
        <>
          <StatTiles tiles={tiles} className="mb-6" />
          {prochain ? (
            <p className="mb-4 text-sm">
              Prochain : <span className="font-medium">{prochain.libelle}</span>{" "}
              <span className="text-muted-foreground">le {formatDate(prochain.date_jalon)}</span>
            </p>
          ) : null}
          <ol className="relative ml-3 flex flex-col gap-6 border-border border-l-2 pl-6">
            {jalons.map((j) => {
              const past = j.date_jalon != null && j.date_jalon < today;
              const done = j.statut === "realise";
              const dot = done
                ? "bg-status-conforme"
                : past
                  ? "bg-status-nc-mineure"
                  : "bg-status-pf";
              return (
                <li key={j.id} className="relative">
                  <span
                    className={`-left-[1.92rem] absolute top-1.5 size-3.5 rounded-full ring-4 ring-surface ${dot}`}
                  />
                  <div className="rounded-2xl border bg-card p-4 shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${BADGE_BASE} ${TYPE_BADGE[j.type] ?? ""}`}>
                            {JALON_TYPE_LABELS[j.type] ?? j.type}
                          </span>
                          <span
                            className={`${BADGE_BASE} ${
                              done
                                ? "bg-status-conforme/15 text-status-conforme"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {done ? "Réalisé" : "Planifié"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDate(j.date_jalon)}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <JalonDialog
                            jalon={j}
                            trigger={
                              <button type="button" className={`${ROW_NAME_BUTTON} font-semibold`}>
                                {j.libelle}
                              </button>
                            }
                          />
                        </div>
                        {j.description ? (
                          <p className="mt-1 text-muted-foreground text-sm">{j.description}</p>
                        ) : null}
                        <Link
                          href={j.audit_id ? `/audits/${j.audit_id}` : "/audits"}
                          className="mt-2 inline-flex items-center gap-1 text-primary text-xs hover:underline"
                        >
                          {j.audit_id ? "Voir l'audit" : "Voir les audits"}
                          <ArrowUpRight className="size-3" />
                        </Link>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <JalonDelete id={j.id} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
