// Which paths are reachable without a staff login. Used by middleware.js.
// Everything not listed here requires a valid session.

const PUBLIC_EXACT = new Set(["/login", "/privacy", "/terms", "/favicon.ico", "/robots.txt"]);

// Public read-only invoice share links: exactly one path segment after /invoice/.
const INVOICE_TOKEN_PATH = /^\/invoice\/[A-Za-z0-9_-]+\/?$/;

// Static files served from /public (images, fonts, icons, manifest).
const STATIC_ASSET = /^\/[A-Za-z0-9_\-/.]*\.(?:ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|webmanifest)$/i;

export function isPublicPath(pathname) {
  if (typeof pathname !== "string") return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (PUBLIC_EXACT.has(path)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (INVOICE_TOKEN_PATH.test(pathname)) return true;
  if (STATIC_ASSET.test(pathname) && !pathname.includes("..")) return true;
  return false;
}

// Server actions can be POSTed to any page path. On public paths, the only
// page that legitimately runs a server action is /login.
export function isActionAllowedOnPublicPath(pathname) {
  return pathname === "/login" || pathname === "/login/";
}

// Only allow same-site relative redirect targets after login (no open redirect).
export function safeNextPath(next) {
  if (typeof next !== "string" || !next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\") || next.startsWith("/login")) return null;
  if (/[\r\n]/.test(next)) return null;
  return next;
}
