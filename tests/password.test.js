import { describe, expect, it } from "vitest";
import { hashPassword, isWellFormedHash, verifyPassword } from "../app/lib/password.mjs";
import { normalizeLogin } from "../app/lib/loginId";

describe("password hashing", () => {
  it("produces salt:hash and verifies the correct password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(isWellFormedHash(stored)).toBe(true);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
  });

  it("uses a random salt (same password, different hashes)", async () => {
    const a = await hashPassword("same-password-123");
    const b = await hashPassword("same-password-123");
    expect(a).not.toBe(b);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("wrong horse battery", stored)).toBe(false);
    expect(await verifyPassword("", stored)).toBe(false);
  });

  it("rejects malformed stored hashes without throwing", async () => {
    for (const bad of [undefined, null, "", "nocolon", "zz:zz", "abcd:1234", "a:b:c", 42, {}]) {
      expect(await verifyPassword("anything", bad)).toBe(false);
      expect(isWellFormedHash(bad)).toBe(false);
    }
  });

  it("rejects a stored hash that was tampered with", async () => {
    const stored = await hashPassword("pw-1234567890");
    const [salt, hash] = stored.split(":");
    const flipped = (hash[0] === "0" ? "1" : "0") + hash.slice(1);
    expect(await verifyPassword("pw-1234567890", `${salt}:${flipped}`)).toBe(false);
  });

  it("rejects non-string passwords", async () => {
    const stored = await hashPassword("pw-1234567890");
    expect(await verifyPassword(undefined, stored)).toBe(false);
    expect(await verifyPassword(12345, stored)).toBe(false);
  });
});

describe("login normalization", () => {
  it("normalizes emails and 10-digit phones", () => {
    expect(normalizeLogin("  Owner@Example.COM ")).toBe("owner@example.com");
    expect(normalizeLogin("(555) 010-0123")).toBe("5550100123");
    expect(normalizeLogin("+1 555 010 0123")).toBe("5550100123");
  });

  it("rejects anything else", () => {
    for (const bad of ["", "abc", "12345", "not an email@", null, 5550100123]) {
      expect(normalizeLogin(bad)).toBe(null);
    }
  });
});
