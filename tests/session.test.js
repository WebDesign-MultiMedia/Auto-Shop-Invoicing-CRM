import { describe, expect, it } from "vitest";
import { SESSION_TTL_MS, signSession, verifySession } from "../app/lib/sessionCore";

const SECRET = "test-secret-".padEnd(64, "x");
const OTHER_SECRET = "other-secret-".padEnd(64, "y");

function payload(overrides = {}) {
  return { l: "owner@example.com", e: Date.now() + SESSION_TTL_MS, s: "sid123", ...overrides };
}

describe("session sign/verify", () => {
  it("accepts a valid session", async () => {
    const token = await signSession(payload(), SECRET);
    const result = await verifySession(token, SECRET);
    expect(result).toMatchObject({ l: "owner@example.com", s: "sid123" });
  });

  it("rejects a tampered payload", async () => {
    const token = await signSession(payload(), SECRET);
    const [, sig] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify(payload({ l: "attacker@example.com" }))).toString("base64url");
    expect(await verifySession(`${forgedBody}.${sig}`, SECRET)).toBe(null);
  });

  it("rejects a tampered signature", async () => {
    const token = await signSession(payload(), SECRET);
    const [body, sig] = token.split(".");
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    expect(await verifySession(`${body}.${flipped}`, SECRET)).toBe(null);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession(payload(), OTHER_SECRET);
    expect(await verifySession(token, SECRET)).toBe(null);
  });

  it("rejects an expired session", async () => {
    const token = await signSession(payload({ e: Date.now() - 1000 }), SECRET);
    expect(await verifySession(token, SECRET)).toBe(null);
  });

  it("expires after 12 hours", async () => {
    const issuedAt = Date.now();
    const token = await signSession(payload({ e: issuedAt + SESSION_TTL_MS }), SECRET);
    expect(await verifySession(token, SECRET, issuedAt + SESSION_TTL_MS - 1)).not.toBe(null);
    expect(await verifySession(token, SECRET, issuedAt + SESSION_TTL_MS + 1)).toBe(null);
  });

  it("fails closed when the secret is missing or too short", async () => {
    const token = await signSession(payload(), SECRET);
    expect(await verifySession(token, undefined)).toBe(null);
    expect(await verifySession(token, "short")).toBe(null);
    await expect(signSession(payload(), "short")).rejects.toThrow();
  });

  it("rejects garbage tokens without throwing", async () => {
    for (const bad of [undefined, "", "abc", "a.b", "a.b.c", "!!!.???", 123]) {
      expect(await verifySession(bad, SECRET)).toBe(null);
    }
  });
});
