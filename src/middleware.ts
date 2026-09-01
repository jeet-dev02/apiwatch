import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirects anyone without a session cookie to /login before the page renders,
 * so protected pages never flash their layout to a logged-out visitor.
 *
 * This is a presence check only — it does NOT validate the cookie. Validation
 * happens on the backend for every API call, which is where it has to happen
 * anyway: middleware runs in the browser's request path and can be bypassed,
 * so it is a UX convenience, never the security boundary.
 */

const PUBLIC_PATHS = ["/login"];
const SESSION_COOKIE = "aw_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Remember where they were headed so login can send them back.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets:
     *   _next/static, _next/image, favicon.ico, and anything with a file
     *   extension (images, fonts, etc).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
