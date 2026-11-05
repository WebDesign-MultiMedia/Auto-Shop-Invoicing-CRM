import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./app/lib/sessionCore";
import { isActionAllowedOnPublicPath, isPublicPath } from "./app/lib/routeRules";

// Runs on the Edge runtime for every request except Next's static files.
// Redirects unauthenticated requests to /login. This is the first layer
// only: every server action and data-reading page ALSO calls requireStaff().
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const isServerAction = request.headers.has("next-action");

  if (isPublicPath(pathname)) {
    if (isServerAction && !isActionAllowedOnPublicPath(pathname)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  // verifySession fails closed if SESSION_SECRET is missing/short.
  const session = token ? await verifySession(token, process.env.SESSION_SECRET) : null;
  if (session) return NextResponse.next();

  // Non-navigation requests (server actions, POSTs) get a plain 401 rather
  // than an HTML redirect they can't use.
  if (isServerAction || (request.method !== "GET" && request.method !== "HEAD")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
