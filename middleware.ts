import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/signin"];

/**
 * Edge-safe gate: just checks for the presence of the NextAuth session cookie.
 * Real validation runs in API routes / server components via `auth()`.
 * Importing the full NextAuth instance here would pull mongodb into the edge
 * bundle and break the runtime.
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isPublic) return NextResponse.next();

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token");

  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/signin", req.nextUrl);
    if (pathname !== "/") url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|icon.*|apple-icon.*).*)",
  ],
};
