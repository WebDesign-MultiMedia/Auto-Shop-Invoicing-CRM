import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword, hashPassword, isWellFormedHash } from "./password.mjs";
import { normalizeLogin } from "./loginId";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  isValidSecret,
  newSessionId,
  signSession,
  verifySession,
} from "./sessionCore";

export class NotAuthorizedError extends Error {
  constructor() {
    super("Not authorized. Please log in again.");
    this.name = "NotAuthorizedError";
  }
}

let warnedConfig = false;
function warnOnce(message) {
  if (!warnedConfig) {
    // Names only - never log env var values.
    console.error(`[auth] ${message} Login is disabled (failing closed).`);
    warnedConfig = true;
  }
}

// Parses STAFF_ACCOUNTS ({"login": "salt:hash", ...}). Returns null (deny
// everyone) if it's missing, not JSON, or has no valid entries.
function getStaffAccounts() {
  const raw = process.env.STAFF_ACCOUNTS;
  if (!raw) {
    warnOnce("STAFF_ACCOUNTS is not set.");
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    warnOnce("STAFF_ACCOUNTS is not valid JSON.");
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    warnOnce("STAFF_ACCOUNTS must be a JSON object.");
    return null;
  }
  const accounts = new Map();
  for (const [login, stored] of Object.entries(parsed)) {
    const normalized = normalizeLogin(login);
    if (normalized && isWellFormedHash(stored)) accounts.set(normalized, stored);
  }
  if (accounts.size === 0) {
    warnOnce("STAFF_ACCOUNTS has no valid entries.");
    return null;
  }
  return accounts;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!isValidSecret(secret)) {
    warnOnce("SESSION_SECRET is missing or shorter than 32 characters.");
    return null;
  }
  return secret;
}

// A throwaway hash so unknown logins cost the same scrypt time as known
// ones - response timing doesn't reveal which logins exist.
let dummyHashPromise;
function getDummyHash() {
  dummyHashPromise ||= hashPassword(newSessionId());
  return dummyHashPromise;
}

// Returns the normalized login on success, otherwise null.
export async function checkCredentials(login, password) {
  const accounts = getStaffAccounts();
  const secret = getSessionSecret();
  const normalized = normalizeLogin(login);
  const stored = accounts && normalized ? accounts.get(normalized) : undefined;

  const ok = await verifyPassword(
    typeof password === "string" ? password : "",
    stored || (await getDummyHash())
  );
  if (!ok || !stored || !secret) return null;
  return normalized;
}

export async function createSession(login) {
  const secret = getSessionSecret();
  if (!secret) throw new NotAuthorizedError();
  const expires = Date.now() + SESSION_TTL_MS;
  const token = await signSession({ l: login, e: expires, s: newSessionId() }, secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

// Returns { login, expires, sid } or null. Also returns null if the account
// was removed from STAFF_ACCOUNTS after the session was issued.
export async function readSession() {
  // Read the cookie first, unconditionally: this marks the calling page as
  // dynamic, so a "not logged in" result is never baked into a static page.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const secret = getSessionSecret();
  const accounts = getStaffAccounts();
  if (!secret || !accounts) return null;
  const payload = await verifySession(token, secret);
  if (!payload || !accounts.has(payload.l)) return null;
  return { login: payload.l, expires: payload.e, sid: payload.s || "" };
}

// Call at the top of every server action / data-reading page.
// Default: throws NotAuthorizedError (use in server actions).
// { redirectToLogin: true }: redirects to /login instead (use in pages).
export async function requireStaff({ redirectToLogin = false } = {}) {
  const session = await readSession();
  if (session) return session;
  if (redirectToLogin) redirect("/login");
  throw new NotAuthorizedError();
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}
