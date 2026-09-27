import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/connexion", "/inscription", "/compte/supprime"];

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );
  // /api/cron est protégée par son propre secret (CRON_SECRET), pas par la session.
  const isApiAuth =
    req.nextUrl.pathname.startsWith("/api/auth") || req.nextUrl.pathname.startsWith("/api/cron");

  if (!req.auth && !isPublic && !isApiAuth) {
    const loginUrl = new URL("/connexion", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
