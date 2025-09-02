// src/middleware.ts
import { NextResponse } from "next/server";
import { getToken, type JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/** Roles que NO pueden acceder al /admin aun estando logueados */
const BLOCKED_ROLES = new Set<string>(["CLIENTE"]);

/** Extrae el rol del token de forma segura y tipada */
function readRole(token: JWT | null): string | null {
  if (!token || typeof token !== "object") return null;
  // El token de next-auth es un objeto flexible: verificamos que traiga 'role' string.
  const maybeRole = (token as Record<string, unknown>).role;
  if (typeof maybeRole === "string" && maybeRole.trim() !== "") {
    return maybeRole.toUpperCase();
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // 1) No logueado -> a /login con callbackUrl para volver a /admin después
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      const callbackUrl = pathname + (search || "");
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
      return NextResponse.redirect(loginUrl);
    }

    // 2) Logueado -> solo bloqueamos a CLIENTE
    const role = readRole(token);
    if (role && BLOCKED_ROLES.has(role)) {
      const home = new URL("/", req.url);
      home.searchParams.set("auth", "forbidden"); // opcional
      return NextResponse.redirect(home);
    }

    // 3) Cualquier otro rol -> permitir
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
