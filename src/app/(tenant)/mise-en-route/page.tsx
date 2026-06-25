import { ArrowRight, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { loadOnboarding } from "@/lib/onboarding";
import { getTenantContext } from "@/lib/tenant-context";

export default async function MiseEnRoutePage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Mise en route"
          description="Suivez les étapes pour configurer votre espace qualité."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut de la page."
        />
      </div>
    );
  }

  const { steps, done, total, prochaineCle, complete } = await loadOnboarding(
    ctx.effectiveTenantId,
  );
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Mise en route"
        description="Suivez ces étapes pour configurer votre espace qualité. Avancez à votre rythme, dans l'ordre proposé."
      />

      {complete ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <PartyPopper className="size-10 text-status-conforme" />
            <p className="font-semibold text-lg">Votre espace est en ordre 🎉</p>
            <p className="max-w-md text-muted-foreground text-sm">
              Toutes les étapes de mise en route sont terminées. Ce module disparaît du menu : vous
              pouvez piloter votre SMQ depuis le tableau de bord.
            </p>
            <Link
              href="/dashboard"
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
            >
              Aller au tableau de bord
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Progression globale */}
          <Card>
            <CardContent className="py-5">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="font-semibold text-sm">
                  {done}/{total} étape{done > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""}
                </p>
                <p className="text-muted-foreground text-xs">{pct}%</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-status-conforme transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Étapes ordonnées */}
          {steps.map((e) => {
            const prochaine = e.cle === prochaineCle;
            return (
              <Link key={e.cle} href={e.href}>
                <Card
                  className={
                    prochaine
                      ? "border-primary/50 ring-1 ring-primary/20 transition-colors"
                      : "transition-colors hover:border-primary/40"
                  }
                >
                  <CardContent className="flex items-center gap-4 py-4">
                    {e.done ? (
                      <CheckCircle2 className="size-6 shrink-0 text-status-conforme" />
                    ) : (
                      <Circle
                        className={`size-6 shrink-0 ${prochaine ? "text-primary" : "text-status-pa"}`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{e.titre}</p>
                        {prochaine ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[10px] text-primary">
                            Commencez ici
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium text-[10px] ${
                            e.done
                              ? "bg-status-conforme/15 text-status-conforme"
                              : "bg-status-pa/15 text-status-pa"
                          }`}
                        >
                          {e.hint}
                        </span>
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
