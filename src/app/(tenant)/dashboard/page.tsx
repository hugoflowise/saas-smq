import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const NC_OUVERTES = ["ouverte", "analysee", "action_definie"] as (
  | "ouverte"
  | "analysee"
  | "action_definie"
)[];
const ACTIONS_ACTIVES = ["a_faire", "en_cours", "bloquee"] as (
  | "a_faire"
  | "en_cours"
  | "bloquee"
)[];

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function DashboardPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble du Système de Management de la Qualité."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour afficher son pilotage."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;
  const today = new Date().toISOString().slice(0, 10);

  // Conformité ISO
  const { count: refTotal } = await supabase
    .from("referentiel_iso")
    .select("id", { count: "exact", head: true });
  const { data: evals } = await supabase
    .from("conformite_evaluation")
    .select("cotation")
    .eq("tenant_id", tid);
  const conformes = (evals ?? []).filter(
    (e) => e.cotation === "conforme" || e.cotation === "point_fort",
  ).length;
  const pctConforme = refTotal && refTotal > 0 ? Math.round((conformes / refTotal) * 100) : 0;

  // NC ouvertes
  const { count: ncOuvertes } = await supabase
    .from("non_conformites")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .in("statut", NC_OUVERTES);

  // Actions en retard
  const { data: actionsRetard } = await supabase
    .from("actions")
    .select("id, reference, description_courte, date_prevue")
    .eq("tenant_id", tid)
    .in("statut", ACTIONS_ACTIVES)
    .lt("date_prevue", today)
    .order("date_prevue", { ascending: true })
    .limit(6);

  // R&O critiques (criticité > 15)
  const { count: roCritiques } = await supabase
    .from("risques_opportunites")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .eq("type", "risque")
    .gt("criticite", 15);

  // Indicateurs hors seuil
  const { data: indicateurs } = await supabase
    .from("indicateurs")
    .select("id, seuil_alerte_min, seuil_alerte_max")
    .eq("tenant_id", tid);
  const { data: valeurs } = await supabase
    .from("indicateurs_valeurs")
    .select("indicateur_id, valeur, date_mesure")
    .eq("tenant_id", tid)
    .order("date_mesure", { ascending: false });
  const lastVal = new Map<string, number>();
  for (const v of valeurs ?? []) {
    if (!lastVal.has(v.indicateur_id)) lastVal.set(v.indicateur_id, v.valeur);
  }
  const indicateursHorsSeuil = (indicateurs ?? []).filter((i) => {
    const v = lastVal.get(i.id);
    if (v === undefined) return false;
    return (
      (i.seuil_alerte_min !== null && v < i.seuil_alerte_min) ||
      (i.seuil_alerte_max !== null && v > i.seuil_alerte_max)
    );
  }).length;

  const retard = actionsRetard ?? [];

  const stats: { label: string; value: string | number; href: string; cls?: string }[] = [
    {
      label: "Conformité ISO",
      value: `${pctConforme}%`,
      href: "/conformite",
      cls: "text-status-conforme",
    },
    { label: "NC ouvertes", value: ncOuvertes ?? 0, href: "/nc", cls: "text-status-nc-mineure" },
    { label: "Actions en retard", value: retard.length, href: "/actions", cls: "text-status-pa" },
    {
      label: "Risques critiques",
      value: roCritiques ?? 0,
      href: "/risques",
      cls: "text-status-nc-majeure",
    },
    {
      label: "Indicateurs hors seuil",
      value: indicateursHorsSeuil,
      href: "/indicateurs",
      cls: "text-status-pa",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble du Système de Management de la Qualité."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="py-5">
                <p className={`font-semibold text-3xl ${s.cls ?? ""}`}>{s.value}</p>
                <p className="mt-1 text-muted-foreground text-xs">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions en retard</CardTitle>
        </CardHeader>
        <CardContent>
          {retard.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune action en retard. 👍</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {retard.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-mono text-muted-foreground text-xs">{a.reference}</span>{" "}
                    {a.description_courte}
                  </span>
                  <span className="shrink-0 text-status-nc-mineure text-xs">
                    échéance {formatDate(a.date_prevue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Link href="/actions" className="text-primary text-sm hover:underline">
              Voir le plan d'actions →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
