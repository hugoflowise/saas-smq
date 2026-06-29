import { createClient } from "@/lib/supabase/server";

/** Une étape du guide de mise en route. */
export type OnboardingStep = {
  cle: string;
  titre: string;
  description: string;
  href: string;
  done: boolean;
  /** Indication courte de l'état (ex. « 3 à valider », « 4/8 complétées », « Fait »). */
  hint: string;
};

export type Onboarding = {
  steps: OnboardingStep[];
  done: number;
  total: number;
  /** Premier pas non terminé (« commencez ici »), ou null si tout est fait. */
  prochaineCle: string | null;
  complete: boolean;
};

/**
 * Calcule le guide de mise en route d'un client : étapes ordonnées selon la norme
 * (personnaliser → contexte §4.1 → domaine §4.3 → parties prenantes §4.2 →
 * processus → fiches → risques & opportunités §6.1 → politique §5.2 →
 * objectifs §6.2 → plan d'actions §10), avec leur état d'avancement. Partagé par
 * la page Mise en route et la navigation (qui masque le module une fois terminé).
 */
export async function loadOnboarding(tid: string): Promise<Onboarding> {
  const supabase = await createClient();

  const restantsAValider = (table: "actions" | "processus" | "parties_interessees") =>
    supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .eq("propose", true)
      .is("valide_le", null);

  const [
    tenant,
    parties,
    processusAValider,
    actionsAValider,
    processusTotal,
    processusSansFinalite,
    politiquePubliee,
    objectifs,
    contexte,
    domaine,
    risques,
  ] = await Promise.all([
    supabase.from("tenants").select("logo_url").eq("id", tid).maybeSingle(),
    restantsAValider("parties_interessees"),
    restantsAValider("processus"),
    restantsAValider("actions"),
    supabase
      .from("processus")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null),
    supabase
      .from("processus")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .is("finalite", null),
    supabase
      .from("politique_qualite")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .eq("statut", "publiee"),
    supabase
      .from("objectifs_qualite")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null),
    // §4.1 Contexte : analyse renseignée (SWOT) → étape faite.
    supabase.from("contexte_organisme").select("analyse_swot").eq("tenant_id", tid).maybeSingle(),
    // §4.3 Domaine d'application : périmètre renseigné → étape faite.
    supabase.from("domaine_application").select("perimetre").eq("tenant_id", tid).maybeSingle(),
    // §6.1 Risques & opportunités : au moins un R&O saisi → étape faite.
    supabase
      .from("risques_opportunites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .is("deleted_at", null),
  ]);

  const nbParties = parties.count ?? 0;
  const nbProcessusAValider = processusAValider.count ?? 0;
  const nbActions = actionsAValider.count ?? 0;
  const nbProcessus = processusTotal.count ?? 0;
  const nbSansFinalite = processusSansFinalite.count ?? 0;
  const fichesCompletes = nbProcessus - nbSansFinalite;
  const contexteFait = Boolean(contexte.data?.analyse_swot);
  const domaineFait = Boolean(domaine.data?.perimetre?.trim());
  const nbRisques = risques.count ?? 0;

  // Étapes dans l'ordre logique de la norme (§4 → §6 → §10) : on cadre le
  // système (contexte, domaine, parties, processus) avant de l'orienter
  // (risques, politique, objectifs) puis de le mettre en œuvre (actions).
  const steps: OnboardingStep[] = [
    {
      cle: "personnaliser",
      titre: "Personnaliser l'espace",
      description: "Ajoutez votre logo et vos informations société pour vos documents.",
      href: "/parametres",
      done: Boolean(tenant.data?.logo_url),
      hint: tenant.data?.logo_url ? "Fait" : "Logo à ajouter",
    },
    {
      cle: "contexte",
      titre: "Analyser le contexte",
      description: "Identifiez les enjeux internes et externes (SWOT/PESTEL) de votre organisme.",
      href: "/strategie/contexte",
      done: contexteFait,
      hint: contexteFait ? "Analysé" : "À analyser",
    },
    {
      cle: "domaine",
      titre: "Définir le domaine d'application",
      description: "Délimitez le périmètre de votre SMQ et justifiez les éventuelles exclusions.",
      href: "/strategie/domaine",
      done: domaineFait,
      hint: domaineFait ? "Défini" : "À définir",
    },
    {
      cle: "parties",
      titre: "Valider les parties prenantes",
      description: "Vérifiez les parties intéressées proposées, leur sphère et leur cotation.",
      href: "/strategie/parties-prenantes",
      done: nbParties === 0,
      hint: nbParties === 0 ? "Validées" : `${nbParties} à valider`,
    },
    {
      cle: "processus",
      titre: "Valider la cartographie des processus",
      description: "Adaptez la cartographie type à votre organisation réelle.",
      href: "/processus",
      done: nbProcessusAValider === 0,
      hint: nbProcessusAValider === 0 ? "Validée" : `${nbProcessusAValider} à valider`,
    },
    {
      cle: "fiches",
      titre: "Compléter les fiches d'identité",
      description: "Renseignez la finalité, le pilote, les entrées/sorties de chaque processus.",
      href: "/processus",
      done: nbProcessus > 0 && nbSansFinalite === 0,
      hint: nbProcessus > 0 ? `${fichesCompletes}/${nbProcessus} complétées` : "À compléter",
    },
    {
      cle: "risques",
      titre: "Identifier les risques et opportunités",
      description: "Recensez les risques et opportunités liés à vos enjeux et à vos processus.",
      href: "/risques",
      done: nbRisques > 0,
      hint: nbRisques > 0 ? `${nbRisques} identifié(s)` : "À identifier",
    },
    {
      cle: "politique",
      titre: "Rédiger la politique qualité",
      description: "Rédigez, faites approuver et publiez votre politique qualité.",
      href: "/strategie/politique",
      done: (politiquePubliee.count ?? 0) > 0,
      hint: (politiquePubliee.count ?? 0) > 0 ? "Publiée" : "À rédiger",
    },
    {
      cle: "objectifs",
      titre: "Définir les objectifs qualité",
      description: "Fixez vos objectifs qualité et leurs indicateurs de mesure.",
      href: "/strategie/objectifs",
      done: (objectifs.count ?? 0) > 0,
      hint: (objectifs.count ?? 0) > 0 ? `${objectifs.count} défini(s)` : "À définir",
    },
    {
      cle: "actions",
      titre: "Passer en revue le plan d'actions",
      description: "Validez les actions de démarrage du SMQ proposées.",
      href: "/actions",
      done: nbActions === 0,
      hint: nbActions === 0 ? "Validé" : `${nbActions} à valider`,
    },
  ];

  const done = steps.filter((s) => s.done).length;
  return {
    steps,
    done,
    total: steps.length,
    prochaineCle: steps.find((s) => !s.done)?.cle ?? null,
    complete: done === steps.length,
  };
}
