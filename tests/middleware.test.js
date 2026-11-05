import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { isPublicPath, safeNextPath } from "../app/lib/routeRules";
import { SESSION_COOKIE, SESSION_TTL_MS, signSession } from "../app/lib/sessionCore";

const SECRET = "middleware-test-secret-".padEnd(64, "m");

describe("public path rules", () => {
  it.each([
    "/login",
    "/login/",
    "/privacy",
    "/terms",
    "/invoice/AbC123_-xyz",
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/favicon.ico",
    "/robots.txt",
    "/images/logo.png",
  ])("%s is public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    "/",
    "/dashboard",
    "/history",
    "/invoice",
    "/invoice/",
    "/invoice/abc/extra",
    "/login-bypass",
    "/loginx",
    "/privacy/../dashboard",
    "/api/anything",
    "/dashboard.json",
  ])("%s is protected", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows same-site relative paths", () => {
    expect(safeNextPath("/history?q=1")).toBe("/history?q=1");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/login", ""])(
    "rejects %s",
    (value) => {
      expect(safeNextPath(value)).toBe(null);
    }
  );
});

describe("middleware", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  function req(path, { method = "GET", headers = {}, cookie } = {}) {
    const h = new Headers(headers);
    if (cookie) h.set("cookie", `${SESSION_COOKIE}=${cookie}`);
    return new NextRequest(new URL(path, "http://localhost:3000"), { method, headers: h });
  }

  async function validCookie(secret = SECRET) {
    return signSession({ l: "owner@example.com", e: Date.now() + SESSION_TTL_MS, s: "sid" }, secret);
  }

  it.each(["/", "/dashboard", "/history"])("redirects %s to /login when logged out", async (path) => {
    const res = await middleware(req(path));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")).pathname).toBe("/login");
  });

  it("keeps the requested page as ?next=", async () => {
    const res = await middleware(req("/history"));
    expect(new URL(res.headers.get("location")).searchParams.get("next")).toBe("/history");
  });

  it("lets a valid session through", async () => {
    const res = await middleware(req("/dashboard", { cookie: await validCookie() }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects a forged or expired cookie", async () => {
    const forged = await middleware(req("/dashboard", { cookie: await validCookie("x".repeat(64)) }));
    expect(forged.status).toBe(307);

    const expired = await signSession({ l: "owner@example.com", e: Date.now() - 1 }, SECRET);
    const res = await middleware(req("/dashboard", { cookie: expired }));
    expect(res.status).toBe(307);
  });

  it("fails closed when SESSION_SECRET is missing", async () => {
    const cookie = await validCookie();
    delete process.env.SESSION_SECRET;
    const res = await middleware(req("/dashboard", { cookie }));
    expect(res.status).toBe(307);
  });

  it("returns 401 (not a redirect) for unauthenticated server actions", async () => {
    const res = await middleware(req("/history", { method: "POST", headers: { "next-action": "abc" } }));
    expect(res.status).toBe(401);
  });

  it("blocks server actions posted to public pages other than /login", async () => {
    for (const path of ["/privacy", "/terms", "/invoice/abc"]) {
      const res = await middleware(req(path, { method: "POST", headers: { "next-action": "abc" } }));
      expect(res.status).toBe(403);
    }
    const login = await middleware(req("/login", { method: "POST", headers: { "next-action": "abc" } }));
    expect(login.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/login", "/privacy", "/terms", "/invoice/sometoken"])("allows %s without login", async (path) => {
    const res = await middleware(req(path));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
