import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/", "/signin"];

/**
 * Edge-safe gate: just checks for the presence of the NextAuth session cookie.
 * Real validation runs in API routes / server components via `auth()`.
 * Importing the full NextAuth instance here would pull mongodb into the edge
 * bundle and break the runtime.
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Shared/public question bank endpoints.
  if (pathname.startsWith("/api/test-banks")) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isPublic) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
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
