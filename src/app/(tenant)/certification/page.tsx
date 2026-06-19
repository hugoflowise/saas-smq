import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { JalonDelete } from "./jalon-delete";
import { JALON_TYPE_LABELS, JalonDialog } from "./jalon-dialog";

const TYPE_BADGE: Record<string, string> = {
  audit_blanc: "bg-status-pa/15 text-status-pa",
  audit_certification: "bg-status-conforme/15 text-status-conforme",
  audit_surveillance: "bg-status-pf/15 text-status-pf",
  revue: "bg-primary/10 text-primary",
  autre: "bg-muted text-muted-foreground",
};

export default async function CertificationPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Cycle de certification" description="Jalons de la démarche ISO 9001." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: jalons } = await supabase
    .from("jalons_certification")
    .select("id, libelle, type, date_jalon, statut, description")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_jalon", { ascending: true, nullsFirst: false });

  const items = jalons ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Cycle de certification"
        description="Jalons de la démarche : audit blanc, certification, surveillances."
        isoClause="ISO 9001 · cycle de 3 ans"
        help="Planifiez les grandes étapes du cycle de certification (audit blanc, audit de certification, audits de surveillance annuels). Chaque jalon peut renvoyer au plan d'actions pour le suivi des écarts."
      >
        <JalonDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun jalon"
          description="Ajoutez les étapes de votre cycle de certification (audit blanc, certification…)."
        />
      ) : (
        <ol className="relative ml-3 flex flex-col gap-6 border-border border-l-2 pl-6">
          {items.map((j) => {
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
                      <p className="mt-1.5 font-semibold">{j.libelle}</p>
                      {j.description ? (
                        <p className="mt-1 text-muted-foreground text-sm">{j.description}</p>
                      ) : null}
                      <Link
                        href="/actions"
                        className="mt-2 inline-flex items-center gap-1 text-primary text-xs hover:underline"
                      >
                        Voir le plan d'actions
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <JalonDialog jalon={j} />
                      <JalonDelete id={j.id} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
