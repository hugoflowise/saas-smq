import { describe, expect, it } from "vitest";
import { calculerScoreMase, type MaseQuestion, type MaseReponse } from "./mase-score";

const Q: MaseQuestion[] = [
  { chapitre: "1.1.1", axe: 1, pointsMax: 80, cotationType: "VD", neutralisable: false },
  { chapitre: "1.1.2", axe: 1, pointsMax: 20, cotationType: "V", neutralisable: false },
  { chapitre: "1.2.1", axe: 1, pointsMax: 5, cotationType: "B", neutralisable: true },
  { chapitre: "2.1.1", axe: 2, pointsMax: 10, cotationType: "B", neutralisable: false },
];

function rep(entries: [string, MaseReponse][]): Map<string, MaseReponse> {
  return new Map(entries);
}

function axeDe(score: ReturnType<typeof calculerScoreMase>, n: number) {
  const a = score.axes.find((x) => x.axe === n);
  if (!a) throw new Error(`axe ${n} absent`);
  return a;
}

describe("calculerScoreMase", () => {
  it("aucune réponse : max compté, obtenus 0, pct 0", () => {
    const s = calculerScoreMase(Q, rep([]));
    const axe1 = axeDe(s, 1);
    expect(axe1.max).toBe(105);
    expect(axe1.obtenus).toBe(0);
    expect(axe1.pct).toBe(0);
    expect(s.totalMax).toBe(115);
    expect(s.pct).toBe(0);
  });

  it("somme les points obtenus et calcule le % par axe", () => {
    const s = calculerScoreMase(
      Q,
      rep([
        ["1.1.1", { pointsObtenus: 40, neutralisee: false }],
        ["1.1.2", { pointsObtenus: 20, neutralisee: false }],
        ["1.2.1", { pointsObtenus: 5, neutralisee: false }],
        ["2.1.1", { pointsObtenus: 10, neutralisee: false }],
      ]),
    );
    const axe1 = axeDe(s, 1);
    expect(axe1.obtenus).toBe(65);
    expect(axe1.max).toBe(105);
    expect(axe1.pct).toBe(62);
    expect(axe1.nbEvaluees).toBe(3);
    expect(s.totalObtenus).toBe(75);
    expect(s.pct).toBe(65);
  });

  it("une question neutralisée est exclue du dénominateur", () => {
    const s = calculerScoreMase(
      Q,
      rep([
        ["1.1.1", { pointsObtenus: 80, neutralisee: false }],
        ["1.2.1", { pointsObtenus: null, neutralisee: true }],
      ]),
    );
    const axe1 = axeDe(s, 1);
    // 1.2.1 (5 pts) neutralisée → max = 80 + 20 = 100
    expect(axe1.max).toBe(100);
    expect(axe1.nbNeutralisees).toBe(1);
    expect(axe1.obtenus).toBe(80);
    expect(axe1.pct).toBe(80);
  });

  it("borne les points : négatifs à 0, au-delà du plafond (double pour VD)", () => {
    const s = calculerScoreMase(
      [
        { chapitre: "x", axe: 1, pointsMax: 10, cotationType: "V", neutralisable: false },
        { chapitre: "y", axe: 1, pointsMax: 10, cotationType: "VD", neutralisable: false },
      ],
      rep([
        ["x", { pointsObtenus: -5, neutralisee: false }],
        ["y", { pointsObtenus: 30, neutralisee: false }],
      ]),
    );
    const axe1 = axeDe(s, 1);
    // x : -5 borné à 0 ; y (VD) : 30 borné à 20 (double de 10)
    expect(axe1.obtenus).toBe(20);
  });

  it("axes triés par numéro", () => {
    const s = calculerScoreMase(Q, rep([]));
    expect(s.axes.map((a) => a.axe)).toEqual([1, 2]);
  });
});
