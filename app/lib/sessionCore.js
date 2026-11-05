// Session cookie signing/verification using the Web Crypto API only, so the
// exact same code runs in Edge middleware and in Node (server actions,
// pages, tests). No "server-only" import here because middleware needs it,
// but nothing in this file is secret on its own - the secret is passed in.
//
// Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256)
// Payload: { l: login, e: expiry (ms since epoch), s: random session id }

export const SESSION_COOKIE = "asc_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  if (typeof str !== "string" || !/^[A-Za-z0-9_-]*$/.test(str)) return null;
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function isValidSecret(secret) {
  return typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH;
}

async function importKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function newSessionId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function signSession(payload, secret) {
  if (!isValidSecret(secret)) throw new Error("SESSION_SECRET is missing or too short.");
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${toBase64Url(sig)}`;
}

// Returns the payload if the signature is valid and the session hasn't
// expired, otherwise null. Never throws. Fails closed on a bad secret.
export async function verifySession(token, secret, now = Date.now()) {
  try {
    if (!isValidSecret(secret) || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, sigPart] = parts;
    const sig = fromBase64Url(sigPart);
    const bodyBytes = fromBase64Url(body);
    if (!sig || !bodyBytes || sig.length !== 32) return null;

    const key = await importKey(secret);
    // subtle.verify does a constant-time comparison.
    const ok = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(body));
    if (!ok) return null;

    const payload = JSON.parse(decoder.decode(bodyBytes));
    if (!payload || typeof payload.l !== "string" || typeof payload.e !== "number") return null;
    if (payload.e <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
