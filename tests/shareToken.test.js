import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createShareToken, resolveShareToken } from "../app/lib/shareToken";

describe("invoice share tokens", () => {
  beforeEach(() => {
    process.env.INVOICE_SHARE_SECRET = "test-share-secret-".padEnd(64, "z");
  });
  afterEach(() => {
    delete process.env.INVOICE_SHARE_SECRET;
  });

  it("round-trips an invoice ID", () => {
    const token = createShareToken("RCT-1730000000000");
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain("RCT");
    expect(resolveShareToken(token)).toBe("RCT-1730000000000");
  });

  it("is deterministic per invoice and unique across invoices", () => {
    expect(createShareToken("RCT-1")).toBe(createShareToken("RCT-1"));
    expect(createShareToken("RCT-1")).not.toBe(createShareToken("RCT-2"));
  });

  it("rejects a tampered token", () => {
    const token = createShareToken("RCT-1730000000000");
    const bytes = Buffer.from(token, "base64url");
    bytes[bytes.length - 1] ^= 0x01; // flip one bit of the ciphertext
    expect(resolveShareToken(bytes.toString("base64url"))).toBe(null);

    const tag = Buffer.from(token, "base64url");
    tag[14] ^= 0x01; // flip one bit of the auth tag
    expect(resolveShareToken(tag.toString("base64url"))).toBe(null);
  });

  it("rejects a token made with a different secret", () => {
    const token = createShareToken("RCT-1730000000000");
    process.env.INVOICE_SHARE_SECRET = "a-completely-different-secret-".padEnd(64, "q");
    expect(resolveShareToken(token)).toBe(null);
  });

  it("rejects garbage", () => {
    for (const bad of [undefined, null, "", "short", "!!!!", 42]) {
      expect(resolveShareToken(bad)).toBe(null);
    }
  });
});
