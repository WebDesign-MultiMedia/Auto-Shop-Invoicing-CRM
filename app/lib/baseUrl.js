import { headers } from "next/headers";

// Resolves the absolute public base URL to build share links from.
// Prefers an explicit NEXT_PUBLIC_APP_URL (set this to your production
// domain, e.g. https://invoice-tt.vercel.app, in Vercel's Production
// environment variables) so links are never accidentally built from a
// preview deployment's URL. Falls back to the current request's Host
// header when unset, so links still work correctly on preview/local
// deployments during testing - never hardcoded to localhost.
export async function getPublicBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const host = (await headers()).get("host");
  if (host) {
    const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}
