import { describe, expect, it } from "vitest";
import { wantsEmail } from "./notification-preferences";

describe("wantsEmail", () => {
  it("active l'e-mail par défaut quand aucune préférence n'est renseignée", () => {
    expect(wantsEmail(null)).toBe(true);
    expect(wantsEmail(undefined)).toBe(true);
    expect(wantsEmail({})).toBe(true);
  });

  it("respecte l'opt-out explicite", () => {
    expect(wantsEmail({ email: false })).toBe(false);
  });

  it("active l'e-mail quand la préférence vaut true", () => {
    expect(wantsEmail({ email: true })).toBe(true);
  });

  it("ignore les valeurs non pertinentes et garde le défaut", () => {
    expect(wantsEmail("oui")).toBe(true);
    expect(wantsEmail(42)).toBe(true);
    expect(wantsEmail({ autre: 1 })).toBe(true);
  });
});
