// ============================================================================
// Calcul du score de l'auto-diagnostic MASE.
//
// Le référentiel MASE est un questionnaire noté : chaque question porte un
// nombre de points max et un type de cotation (B binaire / V variable / VD
// variable doublée). Le score se lit PAR AXE (1 à 5) et au global, en % des
// points obtenus sur les points applicables. Une question neutralisée (motif
// justifié) est exclue du dénominateur.
// ============================================================================

export type CotationType = "B" | "V" | "VD";

export type MaseQuestion = {
  /** Numéro de question, ex. « 1.1.1 ». */
  chapitre: string;
  /** Axe MASE (1 à 5). */
  axe: number;
  pointsMax: number;
  cotationType: CotationType;
  neutralisable: boolean;
};

export type MaseReponse = {
  /** Points obtenus (0..pointsMax ; jusqu'au double en renouvellement pour VD). */
  pointsObtenus: number | null;
  neutralisee: boolean;
};

export type MaseAxeScore = {
  axe: number;
  obtenus: number;
  /** Somme des points max des questions applicables (non neutralisées). */
  max: number;
  /** Pourcentage obtenu/max, ou null si aucun point applicable. */
  pct: number | null;
  nbQuestions: number;
  nbEvaluees: number;
  nbNeutralisees: number;
};

export type MaseScore = {
  axes: MaseAxeScore[];
  totalObtenus: number;
  totalMax: number;
  pct: number | null;
};

/**
 * Borne les points obtenus d'une question : jamais négatifs, plafonnés au max
 * (ou au double pour une question VD, cotée jusqu'au double en renouvellement).
 */
function pointsBornes(q: MaseQuestion, obtenus: number): number {
  const plafond = q.cotationType === "VD" ? q.pointsMax * 2 : q.pointsMax;
  return Math.max(0, Math.min(obtenus, plafond));
}

/**
 * Calcule le score MASE par axe et au global.
 * @param questions le référentiel (questions MASE) ;
 * @param reponses  les réponses du tenant, clé = `chapitre`.
 */
export function calculerScoreMase(
  questions: MaseQuestion[],
  reponses: Map<string, MaseReponse>,
): MaseScore {
  const parAxe = new Map<number, MaseAxeScore>();

  for (const q of questions) {
    const a =
      parAxe.get(q.axe) ??
      ({
        axe: q.axe,
        obtenus: 0,
        max: 0,
        pct: null,
        nbQuestions: 0,
        nbEvaluees: 0,
        nbNeutralisees: 0,
      } satisfies MaseAxeScore);

    a.nbQuestions += 1;
    const r = reponses.get(q.chapitre);

    if (r?.neutralisee) {
      a.nbNeutralisees += 1; // exclue du dénominateur
    } else {
      a.max += q.pointsMax;
      if (r && r.pointsObtenus != null) {
        a.obtenus += pointsBornes(q, r.pointsObtenus);
        a.nbEvaluees += 1;
      }
    }
    parAxe.set(q.axe, a);
  }

  const axes = [...parAxe.values()]
    .map((a) => ({ ...a, pct: a.max > 0 ? Math.round((a.obtenus / a.max) * 100) : null }))
    .sort((x, y) => x.axe - y.axe);

  const totalObtenus = axes.reduce((s, a) => s + a.obtenus, 0);
  const totalMax = axes.reduce((s, a) => s + a.max, 0);

  return {
    axes,
    totalObtenus,
    totalMax,
    pct: totalMax > 0 ? Math.round((totalObtenus / totalMax) * 100) : null,
  };
}
