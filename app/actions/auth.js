"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createSession, logout } from "../lib/auth";
import { normalizeLogin } from "../lib/loginId";
import { consumeAttempt, resetAttempts } from "../lib/rateLimit";
import { safeNextPath } from "../lib/routeRules";

const GENERIC_ERROR = "Invalid login.";

function clientIp() {
  const h = headers();
  // On Vercel, x-forwarded-for is set by the platform; first entry is the client.
  const forwarded = h.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip")) || "unknown";
}

// Used with useFormState on the login page. Intentionally public (no
// requireStaff) - it is the only action allowed without a session.
export async function loginAction(_prevState, formData) {
  const login = String(formData.get("login") || "");
  const password = String(formData.get("password") || "");
  const next = safeNextPath(String(formData.get("next") || "")) || "/dashboard";

  const rateKey = `${clientIp()}|${normalizeLogin(login) || login.trim().toLowerCase().slice(0, 100)}`;
  if (!consumeAttempt(rateKey)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const account = await checkCredentials(login, password);
  if (!account) {
    return { error: GENERIC_ERROR };
  }

  resetAttempts(rateKey);
  await createSession(account);
  redirect(next);
}

export async function logoutAction() {
  logout();
  redirect("/login");
}
