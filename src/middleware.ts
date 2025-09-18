// src/middleware.ts
import { NextResponse } from "next/server";
import { getToken, type JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/** Roles que NO pueden acceder al /admin aun estando logueados */
const BLOCKED_ROLES = new Set<string>(["CLIENTE"]);

/** Bypass: permite saltarse auth en DEV si trae X-Admin-Key correcto */
function isBypassValid(req: NextRequest): boolean {
  const keyFromHeader = req.headers.get("x-admin-key");
  const keyFromQuery = req.nextUrl.searchParams.get("adminKey"); // opcional
  const provided = keyFromHeader ?? keyFromQuery ?? "";
  const expected = process.env.ADMIN_TEST_KEY ?? ""; // define esto en .env

  // Por defecto solo habilitado en desarrollo; para habilitar en prod, define ADMIN_BYPASS_ALLOW_PROD=true
  const allowInProd =
    (process.env.ADMIN_BYPASS_ALLOW_PROD ?? "false") === "true";
  const isDev = process.env.NODE_ENV !== "production";

  return !!provided && provided === expected && (isDev || allowInProd);
}

/** Extrae el rol del token de forma segura y tipada */
function readRole(token: JWT | null): string | null {
  if (!token || typeof token !== "object") return null;
  const maybeRole = (token as Record<string, unknown>).role;
  if (typeof maybeRole === "string" && maybeRole.trim() !== "") {
    return maybeRole.toUpperCase();
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Rutas admin (páginas + API)
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminArea) return NextResponse.next();

  // 0) BYPASS de pruebas (Hoppscotch/Postman)
  if (isBypassValid(req)) return NextResponse.next();

  // 1) Reglas normales de auth/roles
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // No logueado → redirigir a /login (solo para páginas; en API devolvemos 401)
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    const callbackUrl = pathname + (search || "");
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Bloqueamos rol CLIENTE
  const role = readRole(token);
  if (role && BLOCKED_ROLES.has(role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const home = new URL("/", req.url);
    home.searchParams.set("auth", "forbidden");
    return NextResponse.redirect(home);
  }

  // OK
  return NextResponse.next();
}

export const config = {
  // Cubrimos páginas y API de admin
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
