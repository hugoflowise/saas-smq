import Link from "next/link";
import { MonthView } from "@/app/(tenant)/calendrier/calendrier-client";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCalendarEvents } from "@/lib/calendrier";
import { dateOffsetISO, formatDate, todayISO } from "@/lib/format";
import { horsCible } from "@/lib/indicateurs";
import { AUDIT_TYPE_LABELS } from "@/lib/labels";
import { computeNps, npsLabel } from "@/lib/nps";
import { chargerMesuresObjectifs } from "@/lib/objectifs-mesure";
import { loadOnboarding } from "@/lib/onboarding";
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

function progressClass(pct: number) {
  if (pct >= 100) return "bg-status-conforme";
  if (pct >= 60) return "bg-status-pf";
  if (pct >= 30) return "bg-status-pa";
  return "bg-status-nc-mineure";
}

function npsClass(nps: number | null) {
  if (nps == null) return "text-muted-foreground";
  if (nps >= 30) return "text-status-conforme";
  if (nps >= 0) return "text-status-pa";
  return "text-status-nc-mineure";
}

export default async function DashboardPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
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
  const today = todayISO();
  const horizon = dateOffsetISO(30);

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

  // Réclamations ouvertes
  const { count: reclamationsOuvertes } = await supabase
    .from("reclamations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .neq("statut", "cloturee");

  // Actions en retard
  const { data: actionsRetard } = await supabase
    .from("actions")
    .select("id, reference, description_courte, date_prevue")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
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

  // Indicateurs + dernières valeurs (sert aussi aux objectifs liés)
  const { data: indicateurs } = await supabase
    .from("indicateurs")
    .select("id, cible, sens")
    .eq("tenant_id", tid)
    .is("deleted_at", null);
  const { data: valeurs } = await supabase
    .from("indicateurs_valeurs")
    .select("indicateur_id, valeur, date_mesure")
    .eq("tenant_id", tid)
    .order("date_mesure", { ascending: false });
  const lastVal = new Map<string, number>();
  for (const v of valeurs ?? []) {
    if (!lastVal.has(v.indicateur_id)) lastVal.set(v.indicateur_id, Number(v.valeur));
  }
  const indicateursHorsSeuil = (indicateurs ?? []).filter((i) => {
    const v = lastVal.get(i.id);
    if (v === undefined) return false;
    return horsCible(v, i.cible, i.sens);
  }).length;

  // Objectifs qualité (progression pilotée par leurs indicateurs liés)
  const { data: objectifsData } = await supabase
    .from("objectifs_qualite")
    .select("id, intitule, statut")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .order("created_at");
  const objMesures = await chargerMesuresObjectifs(
    supabase,
    tid,
    (objectifsData ?? []).map((o) => o.id),
  );
  const objActifs = (objectifsData ?? [])
    .filter((o) => o.statut !== "abandonne")
    .map((o) => {
      const m = objMesures.get(o.id);
      return {
        ...o,
        pctMoyen: m?.pctMoyen ?? null,
        atteint: o.statut === "atteint" || (m?.indicateursAtteints ?? false),
      };
    });
  const objAtteints = objActifs.filter((o) => o.atteint).length;
  const tauxObjectifs =
    objActifs.length > 0 ? Math.round((objAtteints / objActifs.length) * 100) : null;

  // Satisfaction (NPS global)
  const { data: enquetes } = await supabase
    .from("enquetes_satisfaction")
    .select("note_recommandation")
    .eq("tenant_id", tid);
  const { nps } = computeNps((enquetes ?? []).map((e) => e.note_recommandation));

  // Documents à réviser (révision prévue dépassée ou ≤ 30 j)
  const { data: docsAReviser } = await supabase
    .from("documents_maitrise")
    .select("id, code, titre, date_revision_prevue")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .not("date_revision_prevue", "is", null)
    .lte("date_revision_prevue", horizon)
    .order("date_revision_prevue", { ascending: true });
  const docsList = docsAReviser ?? [];

  const retard = actionsRetard ?? [];

  // Éléments préremplis restant à valider (cf. page Mise en route)
  const [partiesAValider, processusAValider, actionsAValider] = await Promise.all([
    supabase
      .from("parties_interessees")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .eq("propose", true)
      .is("valide_le", null),
    supabase
      .from("processus")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .eq("propose", true)
      .is("valide_le", null),
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .eq("propose", true)
      .is("valide_le", null),
  ]);
  const aValiderTotal =
    (partiesAValider.count ?? 0) + (processusAValider.count ?? 0) + (actionsAValider.count ?? 0);

  // État de la mise en route : pilote le bandeau d'accueil. On guide le nouveau
  // dirigeant tant que les 7 étapes ne sont pas terminées (et pas seulement
  // tant qu'il reste des éléments préremplis à valider).
  const onboarding = await loadOnboarding(tid);
  const prochaineEtape = onboarding.steps.find((s) => s.cle === onboarding.prochaineCle) ?? null;

  // Échéances à venir (30 jours) : agrégation multi-modules
  const [auditsAvenir, revuesAvenir, roAvenir, actionsAvenir, reunionsAvenir, jalonsAvenir] =
    await Promise.all([
      supabase
        .from("audits_internes")
        .select("id, reference, type_audit, perimetre, organisme, date_prevue")
        .eq("tenant_id", tid)
        .neq("statut", "cloture")
        .gte("date_prevue", today)
        .lte("date_prevue", horizon),
      supabase
        .from("revues_direction")
        .select("id, annee, date_realisation")
        .eq("tenant_id", tid)
        .neq("statut", "cloturee")
        .gte("date_realisation", today)
        .lte("date_realisation", horizon),
      supabase
        .from("risques_opportunites")
        .select("id, intitule, date_revue")
        .eq("tenant_id", tid)
        .neq("statut", "cloture")
        .gte("date_revue", today)
        .lte("date_revue", horizon),
      supabase
        .from("actions")
        .select("id, reference, description_courte, date_prevue")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .in("statut", ACTIONS_ACTIVES)
        .gte("date_prevue", today)
        .lte("date_prevue", horizon),
      supabase
        .from("reunions")
        .select("id, titre, date_prevue")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .neq("statut", "terminee")
        .gte("date_prevue", today)
        .lte("date_prevue", horizon),
      supabase
        .from("jalons_certification")
        .select("id, libelle, date_jalon, audit_id")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .neq("statut", "realise")
        .gte("date_jalon", today)
        .lte("date_jalon", horizon),
    ]);

  type Echeance = { date: string; label: string; href: string };
  const echeances: Echeance[] = [];
  for (const a of auditsAvenir.data ?? []) {
    const t =
      AUDIT_TYPE_LABELS[a.type_audit as keyof typeof AUDIT_TYPE_LABELS]?.toLowerCase() ?? "";
    echeances.push({
      date: a.date_prevue as string,
      label: `Audit ${t} · ${a.perimetre ?? a.organisme ?? a.reference}`,
      href: `/audits/${a.id}`,
    });
  }
  for (const r of revuesAvenir.data ?? []) {
    echeances.push({
      date: r.date_realisation as string,
      label: `Revue de direction ${r.annee}`,
      href: "/revues/direction",
    });
  }
  for (const r of roAvenir.data ?? []) {
    echeances.push({
      date: r.date_revue as string,
      label: `Revue R&O · ${r.intitule}`,
      href: `/risques/${r.id}`,
    });
  }
  for (const a of actionsAvenir.data ?? []) {
    echeances.push({
      date: a.date_prevue as string,
      label: `Action · ${a.description_courte}`,
      href: `/actions/${a.id}`,
    });
  }
  for (const r of reunionsAvenir.data ?? []) {
    echeances.push({
      date: r.date_prevue as string,
      label: `Réunion QHSE · ${r.titre}`,
      href: `/reunions/${r.id}`,
    });
  }
  for (const j of jalonsAvenir.data ?? []) {
    // Rattaché à un audit : déjà listé via les audits à venir, on évite le doublon.
    if (j.audit_id) continue;
    echeances.push({
      date: j.date_jalon as string,
      label: `Certification · ${j.libelle}`,
      href: "/calendrier",
    });
  }
  echeances.sort((a, b) => a.date.localeCompare(b.date));

  // Aperçu du calendrier qualité (même source que la page Calendrier).
  const calendarEvents = await loadCalendarEvents(tid);
  const echeancesAvenir = echeances.slice(0, 8);

  const stats: { label: string; value: string | number; href: string; cls?: string }[] = [
    {
      label: "Conformité ISO",
      value: `${pctConforme}%`,
      href: "/conformite",
      cls: "text-status-conforme",
    },
    {
      label: "Objectifs atteints",
      value: tauxObjectifs === null ? "-" : `${tauxObjectifs}%`,
      href: "/strategie/objectifs",
      cls: "text-status-conforme",
    },
    {
      label: `NPS (${npsLabel(nps)})`,
      value: nps ?? "-",
      href: "/suivi-prestation",
      cls: npsClass(nps),
    },
    { label: "Actions en retard", value: retard.length, href: "/actions", cls: "text-status-pa" },
    { label: "NC ouvertes", value: ncOuvertes ?? 0, href: "/nc", cls: "text-status-nc-mineure" },
    {
      label: "Réclamations ouvertes",
      value: reclamationsOuvertes ?? 0,
      href: "/reclamations",
      cls: "text-status-nc-mineure",
    },
    {
      label: "Risques critiques",
      value: roCritiques ?? 0,
      href: "/risques",
      cls: "text-status-nc-majeure",
    },
    {
      label: "Indicateurs hors cible",
      value: indicateursHorsSeuil,
      href: "/indicateurs",
      cls: "text-status-pa",
    },
    {
      label: "Documents à réviser",
      value: docsList.length,
      href: "/documents",
      cls: docsList.length > 0 ? "text-status-pa" : "text-foreground",
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble du Système de Management de la Qualité."
      />

      {onboarding.complete ? null : (
        <Link href="/mise-en-route" className="mb-6 block">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-status-pa/40 bg-status-pa/10 px-4 py-3 transition-colors hover:bg-status-pa/15">
            <div className="min-w-0">
              <p className="font-medium text-sm text-status-pa">
                Bienvenue dans votre espace qualité · mise en route {onboarding.done}/
                {onboarding.total} étapes
              </p>
              <p className="mt-0.5 text-status-pa/80 text-xs">
                {aValiderTotal > 0
                  ? `Votre espace est déjà pré-rempli : ${aValiderTotal} élément${aValiderTotal > 1 ? "s" : ""} à passer en revue et valider.`
                  : prochaineEtape
                    ? `Prochaine étape : ${prochaineEtape.titre}.`
                    : "Finalisez les dernières étapes de configuration."}
              </p>
            </div>
            <span className="shrink-0 font-medium text-primary text-sm">Continuer →</span>
          </div>
        </Link>
      )}

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

      <div className="grid gap-4 lg:grid-cols-2">
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
                    <Link
                      href={`/actions/${a.id}`}
                      className="min-w-0 truncate hover:text-primary hover:underline"
                    >
                      <span className="font-mono text-muted-foreground text-xs">{a.reference}</span>{" "}
                      {a.description_courte}
                    </Link>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Échéances à venir (30 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            {echeancesAvenir.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune échéance dans les 30 jours.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {echeancesAvenir.map((e) => (
                  <li
                    key={`${e.href}-${e.date}-${e.label}`}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <Link
                      href={e.href}
                      className="min-w-0 truncate hover:text-primary hover:underline"
                    >
                      {e.label}
                    </Link>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {formatDate(e.date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/calendrier" className="text-primary text-sm hover:underline">
                Voir le calendrier qualité →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Objectifs qualité</CardTitle>
          </CardHeader>
          <CardContent>
            {objActifs.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun objectif défini.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {objActifs.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{o.intitule}</span>
                      {o.pctMoyen !== null ? (
                        <span className="shrink-0 font-medium text-xs">{o.pctMoyen}%</span>
                      ) : (
                        <span className="shrink-0 text-status-pa text-xs">sans indicateur</span>
                      )}
                    </div>
                    {o.pctMoyen !== null ? (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${progressClass(o.pctMoyen)}`}
                          style={{ width: `${o.pctMoyen}%` }}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/strategie/objectifs" className="text-primary text-sm hover:underline">
                Voir les objectifs →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents à réviser</CardTitle>
          </CardHeader>
          <CardContent>
            {docsList.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune révision à prévoir. 👍</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {docsList.slice(0, 6).map((d) => {
                  const enRetard = (d.date_revision_prevue as string) < today;
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Link
                        href="/documents"
                        className="min-w-0 truncate hover:text-primary hover:underline"
                      >
                        {d.code ? (
                          <span className="font-mono text-muted-foreground text-xs">{d.code}</span>
                        ) : null}{" "}
                        {d.titre}
                      </Link>
                      <span
                        className={`shrink-0 text-xs ${
                          enRetard ? "text-status-nc-mineure" : "text-status-pa"
                        }`}
                      >
                        {formatDate(d.date_revision_prevue)}
                        {enRetard ? " · en retard" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3">
              <Link href="/documents" className="text-primary text-sm hover:underline">
                Voir la liste maîtresse des documents →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Calendrier qualité</CardTitle>
            <Link href="/calendrier" className="font-medium text-primary text-sm hover:underline">
              Voir le calendrier →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {calendarEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune échéance planifiée. Planifiez des audits, revues, actions… ou ajoutez un
              événement dans le calendrier.
            </p>
          ) : (
            <MonthView events={calendarEvents} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
