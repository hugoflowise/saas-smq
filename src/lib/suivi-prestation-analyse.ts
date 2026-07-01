/**
 * Agrégation des suivis de prestation en un tableau de bord d'analyse
 * (écoute client) destiné au pilotage et à la revue de direction (ISO 9001
 * §9.1.2 / §9.3). Fonctions pures : testables sans base ni rendu.
 */

import { computeNps, npsLabel } from "@/lib/nps";
import { QSSE_FIELDS, SATISFACTION_AXES } from "@/lib/suivi-prestation";

/** Ligne minimale d'un suivi telle que lue en base pour l'analyse. */
export type SuiviPrestationRow = {
  consultant: string | null;
  client: string | null;
  mission: string | null;
  date_suivi: string | null;
  satisfaction_globale: number | null;
  nps: number | null;
  est_reclamation: boolean;
  reponses: Record<string, unknown> | null;
};

/** Une barre « part de satisfaits » (top box) pour un axe de satisfaction. */
export type AxeStat = {
  key: string;
  label: string;
  /** Moyenne des notes sur l'échelle 1-4 (null si aucune réponse). */
  moyenne: number | null;
  /** % de réponses « satisfait ou très satisfait » (note >= 3). */
  pct: number | null;
  /** Nombre de réponses prises en compte. */
  count: number;
};

export type Comptage = { label: string; count: number };

export type Vigilance = {
  client: string;
  consultant: string;
  mission: string | null;
  date: string | null;
  satisfaction: number | null;
  nps: number | null;
  motif: string;
};

export type Verbatim = {
  texte: string;
  client: string;
  date: string | null;
  /** Nature du verbatim (satisfaction, bilan, amélioration). */
  origine: string;
};

export type AnalyseSuiviPrestation = {
  nbSuivis: number;
  nbClients: number;
  nbConsultants: number;
  /** Satisfaction globale moyenne sur 5 (null si aucune note). */
  satMoyenne: number | null;
  /** % de clients satisfaits (note globale >= 4). */
  satPct: number | null;
  nps: number | null;
  npsLabel: string;
  npsRepartition: {
    promoteurs: number;
    passifs: number;
    detracteurs: number;
    total: number;
    pctPromoteurs: number;
    pctPassifs: number;
    pctDetracteurs: number;
  };
  axes: AxeStat[];
  conformiteQsse: number | null;
  /** Nombre de suivis ayant révélé au moins un besoin de développement concret. */
  nbBesoinsDetectes: number;
  besoins: Comptage[];
  pointsForts: Comptage[];
  axesAmelioration: Comptage[];
  vigilance: Vigilance[];
  verbatims: Verbatim[];
};

/** Option « aucun besoin » à exclure du décompte des besoins détectés. */
const AUCUN_BESOIN = "Aucun besoin identifié pour l'instant";

function reponsesDe(row: SuiviPrestationRow): Record<string, unknown> {
  const r = row.reponses;
  return r && typeof r === "object" ? (r as Record<string, unknown>) : {};
}

/** Récupère une liste de chaînes depuis un champ multi (tolère valeur absente). */
function multi(rep: Record<string, unknown>, key: string): string[] {
  const v = rep[key];
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

/** Récupère un texte non vide depuis un champ textarea. */
function texte(rep: Record<string, unknown>, key: string): string | null {
  const v = rep[key];
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/** Comptage décroissant d'une liste d'étiquettes. */
function compter(labels: string[]): Comptage[] {
  const map = new Map<string, number>();
  for (const l of labels) map.set(l, (map.get(l) ?? 0) + 1);
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
}

export function analyserSuivisPrestation(rows: SuiviPrestationRow[]): AnalyseSuiviPrestation {
  const nbSuivis = rows.length;
  const nbClients = new Set(rows.map((r) => (r.client ?? "").trim().toLowerCase()).filter(Boolean))
    .size;
  const nbConsultants = new Set(
    rows.map((r) => (r.consultant ?? "").trim().toLowerCase()).filter(Boolean),
  ).size;

  // Satisfaction globale (sur 5).
  const notes = rows.map((r) => r.satisfaction_globale).filter((n): n is number => n != null);
  const satMoyenne =
    notes.length > 0
      ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
      : null;
  const satPct =
    notes.length > 0 ? Math.round((notes.filter((n) => n >= 4).length / notes.length) * 100) : null;

  // NPS + répartition promoteurs / passifs / détracteurs.
  const { nps } = computeNps(rows.map((r) => r.nps));
  const npsNotes = rows.map((r) => r.nps).filter((n): n is number => n != null);
  const promoteurs = npsNotes.filter((n) => n >= 9).length;
  const detracteurs = npsNotes.filter((n) => n <= 6).length;
  const passifs = npsNotes.length - promoteurs - detracteurs;
  const totalNps = npsNotes.length;
  const pct = (n: number) => (totalNps > 0 ? Math.round((n / totalNps) * 100) : 0);

  // Zoom par axe de satisfaction (matrice 1-4, top box = note >= 3).
  const axes: AxeStat[] = SATISFACTION_AXES.map((axe) => {
    const vals: number[] = [];
    for (const row of rows) {
      const rep = reponsesDe(row);
      const m = rep.satisfaction_axes;
      if (!m || typeof m !== "object") continue;
      const raw = (m as Record<string, unknown>)[axe.key];
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 1 && n <= 4) vals.push(n);
    }
    const count = vals.length;
    return {
      key: axe.key,
      label: axe.label,
      moyenne: count > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / count) * 100) / 100 : null,
      pct: count > 0 ? Math.round((vals.filter((n) => n >= 3).length / count) * 100) : null,
      count,
    };
  });

  // Conformité QSSE : Oui / (Oui + Non), les « Sans objet » sont ignorés.
  let qOui = 0;
  let qNon = 0;
  for (const row of rows) {
    const rep = reponsesDe(row);
    for (const q of QSSE_FIELDS) {
      if (rep[q.key] === "Oui") qOui++;
      else if (rep[q.key] === "Non") qNon++;
    }
  }
  const conformiteQsse = qOui + qNon > 0 ? Math.round((qOui / (qOui + qNon)) * 100) : null;

  // Besoins de développement détectés.
  const besoinsFlat: string[] = [];
  let nbBesoinsDetectes = 0;
  for (const row of rows) {
    const besoins = multi(reponsesDe(row), "besoins_futurs").filter((b) => b !== AUCUN_BESOIN);
    if (besoins.length > 0) nbBesoinsDetectes++;
    besoinsFlat.push(...besoins);
  }

  // Bilan qualitatif agrégé.
  const pointsFortsFlat: string[] = [];
  const axesAmeliorationFlat: string[] = [];
  for (const row of rows) {
    const rep = reponsesDe(row);
    pointsFortsFlat.push(...multi(rep, "points_forts"));
    axesAmeliorationFlat.push(...multi(rep, "axes_amelioration"));
  }

  // Points de vigilance : réclamations et notes basses.
  const vigilance: Vigilance[] = [];
  for (const row of rows) {
    const motifs: string[] = [];
    if (row.est_reclamation) motifs.push("Réclamation");
    if (row.satisfaction_globale != null && row.satisfaction_globale <= 2) {
      motifs.push(`Satisfaction ${row.satisfaction_globale}/5`);
    }
    if (row.nps != null && row.nps <= 6) motifs.push(`NPS ${row.nps}/10 (détracteur)`);
    if (motifs.length === 0) continue;
    vigilance.push({
      client: (row.client ?? "").trim() || "Client non précisé",
      consultant: (row.consultant ?? "").trim() || "-",
      mission: row.mission,
      date: row.date_suivi,
      satisfaction: row.satisfaction_globale,
      nps: row.nps,
      motif: motifs.join(" · "),
    });
  }
  vigilance.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  // Verbatims : commentaires clients (satisfaction, bilan, amélioration).
  const verbatims: Verbatim[] = [];
  const sources: { key: string; origine: string }[] = [
    { key: "commentaire_satisfaction", origine: "Satisfaction" },
    { key: "commentaire_bilan", origine: "Bilan" },
    { key: "amelioration_prestations", origine: "Amélioration attendue" },
  ];
  for (const row of rows) {
    const rep = reponsesDe(row);
    for (const s of sources) {
      const t = texte(rep, s.key);
      if (!t) continue;
      verbatims.push({
        texte: t,
        client: (row.client ?? "").trim() || "Client non précisé",
        date: row.date_suivi,
        origine: s.origine,
      });
    }
  }
  verbatims.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return {
    nbSuivis,
    nbClients,
    nbConsultants,
    satMoyenne,
    satPct,
    nps,
    npsLabel: npsLabel(nps),
    npsRepartition: {
      promoteurs,
      passifs,
      detracteurs,
      total: totalNps,
      pctPromoteurs: pct(promoteurs),
      pctPassifs: pct(passifs),
      pctDetracteurs: pct(detracteurs),
    },
    axes,
    conformiteQsse,
    nbBesoinsDetectes,
    besoins: compter(besoinsFlat),
    pointsForts: compter(pointsFortsFlat),
    axesAmelioration: compter(axesAmeliorationFlat),
    vigilance,
    verbatims,
  };
}

/** Années (décroissantes) présentes dans les dates de suivi. */
export function anneesDisponibles(rows: SuiviPrestationRow[]): number[] {
  const set = new Set<number>();
  for (const r of rows) {
    const y = Number((r.date_suivi ?? "").slice(0, 4));
    if (Number.isFinite(y) && y > 2000) set.add(y);
  }
  return [...set].sort((a, b) => b - a);
}
