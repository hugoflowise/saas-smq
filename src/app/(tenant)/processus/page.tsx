import Link from "next/link";
import { charteColors } from "@/components/document-paper";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProposeBadge } from "@/components/propose-badge";
import { ProposeBanner, RefuserButton, ValiderButton } from "@/components/propose-controls";
import { dateOffsetISO, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CreateProcessusDialog } from "./create-processus-dialog";

const COLUMNS = [
  { type: "pilotage" as const, label: "Processus de pilotage" },
  { type: "realisation" as const, label: "Processus de réalisation" },
  { type: "support" as const, label: "Processus support" },
];

// Bandes latérales du diagramme : entrées (gauche) et sorties (droite).
function SideBand({ label, side }: { label: string; side: "left" | "right" }) {
  const band = (
    <div className="flex w-full items-center justify-center rounded-md bg-muted px-3 py-4 text-center font-semibold text-[11px] text-muted-foreground uppercase leading-snug tracking-wide lg:h-full lg:w-32">
      {label}
    </div>
  );
  // Chevron pointant vers la droite (sens de lecture entrées → sorties).
  const chevron = (
    <div
      aria-hidden
      className="hidden size-0 self-center border-y-[14px] border-y-transparent border-l-[14px] border-l-muted lg:block"
    />
  );
  return (
    <div className="flex shrink-0 items-stretch gap-0 lg:w-36">
      {side === "left" ? (
        <>
          {band}
          {chevron}
        </>
      ) : (
        <>
          {chevron}
          {band}
        </>
      )}
    </div>
  );
}

export default async function ProcessusPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Cartographie des processus"
          description="Processus de pilotage, de réalisation et de support."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut de la page pour afficher sa cartographie."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: processus }, { data: tenant }] = await Promise.all([
    supabase
      .from("processus")
      .select("id, nom, type, description, date_prochaine_revue, propose, valide_le")
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("ordre_affichage", { ascending: true }),
    supabase.from("tenants").select("couleur_charte").eq("id", ctx.effectiveTenantId).maybeSingle(),
  ]);

  // Bandeaux de famille à la couleur de charte du client (neutre par défaut).
  const { charte, contrast } = charteColors(tenant?.couleur_charte);

  const items = processus ?? [];
  const aValider = items.filter((p) => p.propose && !p.valide_le).length;

  const today = todayISO();
  const horizon60 = dateOffsetISO(60);
  /** "retard" | "bientot" | null selon la prochaine revue. */
  function revueAlerte(date: string | null): "retard" | "bientot" | null {
    if (!date) return null;
    if (date < today) return "retard";
    if (date <= horizon60) return "bientot";
    return null;
  }
  const aReviser = items.filter((p) => revueAlerte(p.date_prochaine_revue) !== null).length;

  return (
    <div className="w-full">
      <PageHeader
        title="Cartographie des processus"
        description="Processus de pilotage, de réalisation et de support."
        isoClause="ISO 9001 §4.4"
        help="Déterminez les processus du SMQ et leurs interactions : pilote, entrées/sorties, ressources, critères et indicateurs de performance (approche processus)."
      >
        <CreateProcessusDialog />
      </PageHeader>

      <ProposeBanner table="processus" count={aValider} libelle="processus" />

      {aReviser > 0 ? (
        <div className="mb-4 rounded-lg border border-status-pa/40 bg-status-pa/10 px-4 py-2.5 text-sm text-status-pa">
          {aReviser} processus à réviser (revue échue ou prévue sous 60 jours).
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aucun processus"
          description="Créez votre premier processus pour démarrer la cartographie."
        />
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <SideBand
            label="Besoins clients et attentes des parties prenantes pertinentes"
            side="left"
          />

          {/* Les 3 familles de processus, empilées (pilotage / réalisation / support). */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {COLUMNS.map((col) => {
              const colItems = items.filter((p) => p.type === col.type);
              return (
                <section key={col.type} className="overflow-hidden rounded-md border">
                  <div
                    className="px-4 py-2 text-center font-semibold text-sm uppercase tracking-wide"
                    style={{ backgroundColor: charte, color: contrast }}
                  >
                    {col.label}
                  </div>
                  <div className="flex flex-wrap gap-3 bg-surface p-3">
                    {colItems.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Aucun processus.</p>
                    ) : (
                      colItems.map((p) => {
                        const aValiderCard = p.propose && !p.valide_le;
                        const alerte = revueAlerte(p.date_prochaine_revue);
                        return (
                          <div
                            key={p.id}
                            className="flex min-w-[180px] flex-1 basis-[200px] flex-col overflow-hidden rounded-md border bg-card"
                          >
                            <Link
                              href={`/processus/${p.id}`}
                              className="flex flex-1 flex-col px-3 py-2.5 text-sm transition-colors hover:bg-primary/5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium">{p.nom}</p>
                                {alerte === "retard" ? (
                                  <span className="shrink-0 rounded-full bg-status-nc-mineure/15 px-2 py-0.5 font-medium text-[10px] text-status-nc-mineure">
                                    Revue en retard
                                  </span>
                                ) : alerte === "bientot" ? (
                                  <span className="shrink-0 rounded-full bg-status-pa/15 px-2 py-0.5 font-medium text-[10px] text-status-pa">
                                    À réviser
                                  </span>
                                ) : null}
                              </div>
                              {p.description ? (
                                <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                                  {p.description}
                                </p>
                              ) : null}
                              {aValiderCard ? <ProposeBadge className="mt-1.5" /> : null}
                            </Link>
                            {aValiderCard ? (
                              <div className="flex justify-end gap-1 border-t bg-card px-2 py-1.5">
                                <RefuserButton table="processus" id={p.id} />
                                <ValiderButton table="processus" id={p.id} />
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          <SideBand label="Satisfaction client et des parties prenantes pertinentes" side="right" />
        </div>
      )}
    </div>
  );
}
