import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

// Une étape de mise en route. Aujourd'hui seules les étapes de type
// « validation d'éléments préremplis » existent (plan d'actions, processus,
// parties prenantes). À terme, d'autres modules viendront s'ajouter ici
// (politique, contexte, objectifs, risques…) : la structure est prête.
type Etape = {
  cle: string;
  titre: string;
  description: string;
  href: string;
  aValider: number; // éléments préremplis non encore validés
  total: number; // éléments préremplis au total
};

export default async function MiseEnRoutePage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Mise en route"
          description="Validez les éléments que nous avons préremplis pour vous."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut de la page."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  // Pour chaque module prérempli : total proposé + nombre restant à valider.
  const compter = (table: "actions" | "processus" | "parties_interessees") =>
    Promise.all([
      supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tid)
        .eq("propose", true),
      supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tid)
        .eq("propose", true)
        .is("valide_le", null),
    ]);

  const [actions, processus, parties] = await Promise.all([
    compter("actions"),
    compter("processus"),
    compter("parties_interessees"),
  ]);

  const etapes: Etape[] = [
    {
      cle: "parties",
      titre: "Parties prenantes",
      description: "Vérifiez les parties intéressées proposées, leur sphère et leur cotation.",
      href: "/strategie/parties-prenantes",
      total: parties[0].count ?? 0,
      aValider: parties[1].count ?? 0,
    },
    {
      cle: "processus",
      titre: "Cartographie des processus",
      description: "Adaptez la cartographie type à votre organisation réelle.",
      href: "/processus",
      total: processus[0].count ?? 0,
      aValider: processus[1].count ?? 0,
    },
    {
      cle: "actions",
      titre: "Plan d'actions de démarrage",
      description: "Passez en revue les actions de démarrage du SMQ proposées.",
      href: "/actions",
      total: actions[0].count ?? 0,
      aValider: actions[1].count ?? 0,
    },
  ];

  // N'affiche que les étapes qui ont effectivement des éléments préremplis.
  const visibles = etapes.filter((e) => e.total > 0);
  const terminees = visibles.filter((e) => e.aValider === 0).length;
  const restantes = visibles.reduce((sum, e) => sum + e.aValider, 0);
  const pct = visibles.length > 0 ? Math.round((terminees / visibles.length) * 100) : 100;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Mise en route"
        description="Nous avons prérempli votre espace avec des éléments types conseillés. Passez chacun en revue, puis validez, modifiez ou supprimez selon votre réalité."
      />

      {visibles.length === 0 ? (
        <EmptyState
          title="Rien à valider"
          description="Aucun élément prérempli en attente. Votre espace est prêt."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Progression globale */}
          <Card>
            <CardContent className="py-5">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="font-semibold text-sm">
                  {terminees}/{visibles.length} module{visibles.length > 1 ? "s" : ""} validé
                  {terminees > 1 ? "s" : ""}
                </p>
                <p className="text-muted-foreground text-xs">
                  {restantes > 0
                    ? `${restantes} élément${restantes > 1 ? "s" : ""} à valider`
                    : "Tout est validé 👍"}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-status-conforme transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Liste des étapes */}
          {visibles.map((e) => {
            const fait = e.aValider === 0;
            return (
              <Link key={e.cle} href={e.href}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-4 py-4">
                    {fait ? (
                      <CheckCircle2 className="size-6 shrink-0 text-status-conforme" />
                    ) : (
                      <Circle className="size-6 shrink-0 text-status-pa" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{e.titre}</p>
                        {fait ? (
                          <span className="rounded-full bg-status-conforme/15 px-2 py-0.5 font-medium text-[10px] text-status-conforme">
                            Validé
                          </span>
                        ) : (
                          <span className="rounded-full bg-status-pa/15 px-2 py-0.5 font-medium text-[10px] text-status-pa">
                            {e.aValider} à valider
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-muted-foreground text-sm">{e.description}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
