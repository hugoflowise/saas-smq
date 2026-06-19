/** Calcul du Net Promoter Score à partir de notes de recommandation (0-10). */
export function computeNps(notes: (number | null)[]): { nps: number | null; count: number } {
  const valid = notes.filter((n): n is number => n != null);
  if (valid.length === 0) return { nps: null, count: 0 };
  const promoteurs = valid.filter((n) => n >= 9).length;
  const detracteurs = valid.filter((n) => n <= 6).length;
  const nps = Math.round(((promoteurs - detracteurs) / valid.length) * 100);
  return { nps, count: valid.length };
}

/** Appréciation qualitative d'un NPS. */
export function npsLabel(nps: number | null): string {
  if (nps == null) return "—";
  if (nps >= 70) return "Excellent";
  if (nps >= 30) return "Bon";
  if (nps >= 0) return "À améliorer";
  return "Insuffisant";
}

/** Trimestre "AAAA-Tn" d'une date ISO. */
export function trimestre(dateIso: string): string {
  const [y, m] = dateIso.split("-");
  const q = Math.floor((Number(m) - 1) / 3) + 1;
  return `${y}-T${q}`;
}
