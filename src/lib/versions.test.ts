import { describe, expect, it } from "vitest";
import { versionLettre } from "./versions";

describe("versionLettre", () => {
  it("attribue A à la première version (index 0)", () => {
    expect(versionLettre(0)).toBe("A");
    expect(versionLettre(1)).toBe("B");
    expect(versionLettre(25)).toBe("Z");
  });

  it("passe à deux lettres au-delà de Z", () => {
    expect(versionLettre(26)).toBe("AA");
    expect(versionLettre(27)).toBe("AB");
    expect(versionLettre(51)).toBe("AZ");
    expect(versionLettre(52)).toBe("BA");
  });
});
