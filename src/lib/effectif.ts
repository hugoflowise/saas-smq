/** Calculs d'effectif et de couverture à partir du référentiel consultants. */

export type Consultant = {
  id: string;
  reference: string | null;
  nom: string;
  prenom: string | null;
  entite: string | null;
  poste: string | null;
  date_demarrage: string | null;
  date_fin: string | null;
  odm: boolean;
  pdp: boolean;
  visite_medicale: boolean;
};

function shiftIso(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Un consultant est présent à la date `iso` s'il a démarré et n'est pas (encore) sorti. */
function actifLe(c: Consultant, iso: string): boolean {
  if (!c.date_demarrage || c.date_demarrage > iso) return false;
  return !c.date_fin || c.date_fin >= iso;
}

export function computeEffectif(consultants: Consultant[], todayIso: string) {
  const actifs = consultants.filter((c) => actifLe(c, todayIso));
  const n = actifs.length;
  const pct = (k: number) => (n > 0 ? Math.round((k / n) * 100) : null);

  const couverture = {
    odm: pct(actifs.filter((c) => c.odm).length),
    pdp: pct(actifs.filter((c) => c.pdp).length),
    visite: pct(actifs.filter((c) => c.visite_medicale).length),
  };

  // Tendance : effectif à la fin de chacune des 12 dernières semaines.
  const trend = Array.from({ length: 12 }, (_, i) => {
    const iso = shiftIso(todayIso, -7 * (11 - i));
    return { date: iso, valeur: consultants.filter((c) => actifLe(c, iso)).length };
  });

  // Mouvements sur la période (12 dernières semaines) + à venir.
  const debutPeriode = shiftIso(todayIso, -84);
  const entrees = consultants.filter(
    (c) => c.date_demarrage && c.date_demarrage >= debutPeriode && c.date_demarrage <= todayIso,
  );
  const sorties = consultants.filter(
    (c) => c.date_fin && c.date_fin >= debutPeriode && c.date_fin <= todayIso,
  );
  const futursArrivants = consultants.filter(
    (c) => c.date_demarrage && c.date_demarrage > todayIso,
  );
  const futursSortants = consultants.filter((c) => c.date_fin && c.date_fin > todayIso);

  return {
    effectifActuel: n,
    couverture,
    trend,
    mouvements: { entrees, sorties, futursArrivants, futursSortants },
  };
}

export function nomComplet(c: { prenom: string | null; nom: string }): string {
  return `${c.prenom ? `${c.prenom} ` : ""}${c.nom}`;
}
