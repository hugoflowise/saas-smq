import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { base64UrlEncode, buildAppJwt, buildClientJwt, buildPayload, sign } from "./jwt";
import type { BoondAppCredentials, BoondClientCredentials } from "./types";

/** Décode un segment base64url → objet JSON (helper de test). */
function decodeSegment(segment: string): unknown {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

describe("base64UrlEncode", () => {
  it("produit du base64url sans padding ni caractères + ou /", () => {
    // ">>>?" en base64 standard = ">>>?" -> contient + et / et padding.
    const encoded = base64UrlEncode(">>>?");
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe("buildPayload", () => {
  it("respecte l'ordre des champs userToken, clientToken, time, mode", () => {
    const payload = buildPayload("user-1", "second-1", { time: 1700000000 });
    expect(Object.keys(payload)).toEqual(["userToken", "clientToken", "time", "mode"]);
  });

  it("applique les valeurs par défaut (mode normal, time = maintenant)", () => {
    const before = Math.floor(Date.now() / 1000);
    const payload = buildPayload("u", "s");
    expect(payload.mode).toBe("normal");
    expect(payload.time).toBeGreaterThanOrEqual(before);
  });
});

describe("buildAppJwt", () => {
  const creds: BoondAppCredentials = {
    mode: "app",
    userToken: "USER",
    appToken: "APPTOKEN",
    appKey: "APPKEY",
  };

  it("produit un JWT à 3 segments (header.payload.signature)", () => {
    const jwt = buildAppJwt(creds, { time: 1700000000 });
    expect(jwt.split(".")).toHaveLength(3);
  });

  it("encode un header HS256 et place l'appToken dans clientToken", () => {
    const jwt = buildAppJwt(creds, { time: 1700000000 });
    const [header, payload] = jwt.split(".");
    expect(decodeSegment(header)).toEqual({ alg: "HS256", typ: "JWT" });
    expect(decodeSegment(payload)).toEqual({
      userToken: "USER",
      clientToken: "APPTOKEN",
      time: 1700000000,
      mode: "normal",
    });
  });

  it("est déterministe pour une clé et un time donnés", () => {
    const a = buildAppJwt(creds, { time: 1700000000 });
    const b = buildAppJwt(creds, { time: 1700000000 });
    expect(a).toBe(b);
  });

  it("signe avec appKey (signature vérifiable en HMAC-SHA256)", () => {
    const jwt = buildAppJwt(creds, { time: 1700000000 });
    const [header, payload, signature] = jwt.split(".");
    const expected = createHmac("sha256", "APPKEY")
      .update(`${header}.${payload}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(signature).toBe(expected);
  });

  it("change de signature si la clé change", () => {
    const jwt1 = buildAppJwt(creds, { time: 1700000000 });
    const jwt2 = buildAppJwt({ ...creds, appKey: "AUTRE" }, { time: 1700000000 });
    expect(jwt1).not.toBe(jwt2);
  });
});

describe("buildClientJwt", () => {
  const creds: BoondClientCredentials = {
    mode: "client",
    userToken: "USER",
    clientToken: "CLIENTTOKEN",
    clientKey: "CLIENTKEY",
  };

  it("place le clientToken dans le payload et signe avec clientKey", () => {
    const jwt = buildClientJwt(creds, { time: 1700000000 });
    const [, payload, signature] = jwt.split(".");
    expect((decodeSegment(payload) as { clientToken: string }).clientToken).toBe("CLIENTTOKEN");
    const signingInput = jwt.split(".").slice(0, 2).join(".");
    expect(signature).toBe(sign(signingInput, "CLIENTKEY"));
  });
});
