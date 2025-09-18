"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useSession, signOut } from "next-auth/react";

/* ===== Iconos ===== */
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" fill="none" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" fill="none" />
    </svg>
  );
}
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props} aria-hidden>
      <path
        d="M12 21s-7.5-4.6-9.4-8.6C1.7 9.8 3.1 7 5.8 6.3c1.7-.4 3.5.3 4.6 1.7 1.1-1.4 2.9-2.1 4.6-1.7 2.7.7 4.1 3.5 3.3 6.1C19.5 16.4 12 21 12 21z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="currentColor"
        d="M7 18a2 2 0 1 0 0 4a2 2 0 0 0 0-4m10 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4M7.2 6l.6 3h10.9a1 1 0 0 1 1 .8l1 5a1 1 0 0 1-1 1.2H8a1 1 0 0 1-1-.8L5.1 4H3a1 1 0 1 1 0-2h3a1 1 0 0 1 1 .8L7.2 6Z"
      />
    </svg>
  );
}

/* ===== Tipos ===== */
type Role = "CLIENTE" | "ADMIN" | "EMPLEADO" | "PROVEEDOR" | undefined;

export default function Header() {
  // Para evitar hydration mismatch:
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState<boolean>(false); // menú móvil
  const [menuOpen, setMenuOpen] = useState<boolean>(false); // dropdown usuario (desktop)

  const { data: session, status } = useSession();
  const role: Role = (session?.user as { role?: Role } | undefined)?.role;
  const hasSession: boolean = status === "authenticated";
  const isCliente: boolean = role === "CLIENTE";

  // cerrar dropdown al click fuera
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const firstName: string = (
    session?.user?.name ??
    session?.user?.email ??
    "Mi cuenta"
  )
    .toString()
    .split(" ")[0];

  const handleLogout = async (): Promise<void> => {
    await signOut({ callbackUrl: "/" });
  };

  // separador visual (•) entre links (siempre igual en SSR y CSR)
  const Sep = () => (
    <span className="sep" aria-hidden="true" style={{ opacity: 0.5 }}>
      {" "}
      •{" "}
    </span>
  );

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Logo */}
        <Link href="/" className="brand" aria-label="Ir al inicio">
          <Image
            src="/beso-logo.png"
            alt="BESO Boutique"
            width={36}
            height={36}
            className="brand-logo"
            // Evitar la advertencia de cambiar solo una dimensión:
            style={{ width: "auto", height: "auto" }}
            priority
          />
          <span className="brand-name">BESO</span>
        </Link>

        {/* Buscador (desktop) */}
        <form
          className="search-form hidden sm:flex"
          role="search"
          aria-label="Buscar en el catálogo"
        >
          <input
            type="search"
            placeholder="Buscar productos…"
            aria-label="Buscar productos"
          />
          <button type="submit" className="btn ghost">
            Buscar
          </button>
        </form>

        {/* Acciones derechas */}
        <div
          className="right-actions"
          style={{ display: "flex", alignItems: "center", gap: ".75rem" }}
          // suprime warnings si el contenido cambia tras montado
          suppressHydrationWarning
        >
          {/* Enlaces (desktop) */}
          <nav
            className="nav-links hidden md:flex"
            aria-label="Principal"
            style={{ alignItems: "center" }}
          >
            <Link href="/productos">Catálogo</Link>
            <Sep />
            <Link href="/categorias">Categorías</Link>
            <Sep />
            <Link href="/sobre-nosotros">Sobre nosotros</Link>
            <Sep />
            <Link href="/contacto">Contáctanos</Link>
          </nav>

          {/* Tema */}
          <ThemeToggle />

          {/* Wishlist (solo si está montado y el cliente está logueado) */}
          {mounted && hasSession && isCliente && (
            <Link
              href="/wishlist"
              className="icon-button"
              aria-label="Lista de deseos"
              title="Lista de deseos"
            >
              <HeartIcon />
            </Link>
          )}

          {/* Carrito */}
          <Link
            href="/carrito"
            className="icon-button cart-button"
            aria-label="Carrito"
            title="Carrito"
          >
            <CartIcon />
            <span className="cart-badge" aria-hidden="true">
              2
            </span>
          </Link>

          {/* Login / Menú usuario (desktop) */}
          {!mounted ? (
            // Mientras monta, evita ramificaciones distintas
            <span
              className="btn ghost"
              aria-hidden="true"
              style={{ visibility: "hidden" }}
            >
              …
            </span>
          ) : !hasSession ? (
            <Link
              href="/login"
              className="btn primary"
              aria-label="Ir al login"
            >
              Login
            </Link>
          ) : (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                className="btn ghost"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                title="Cuenta"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <UserIcon />
                <span className="muted" style={{ fontSize: ".9rem" }}>
                  {firstName}
                </span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="panel"
                  style={{
                    position: "absolute",
                    right: 0,
                    marginTop: 6,
                    width: 240,
                    padding: 8,
                    display: "grid",
                    gap: 6,
                    border: "1px solid var(--stroke)",
                    boxShadow: "0 10px 30px rgba(0,0,0,.15)",
                    zIndex: 20,
                    background: "var(--panel)",
                    color: "var(--ink)",
                  }}
                >
                  <div className="muted" style={{ fontSize: ".8rem" }}>
                    {isCliente ? "Cliente" : role ?? "Usuario"}
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: "var(--stroke)",
                      margin: "4px 0 6px",
                    }}
                  />

                  {isCliente ? (
                    <>
                      <Link className="btn ghost" href="/cuenta">
                        Mis datos
                      </Link>
                      <Link className="btn ghost" href="/cuenta/historial">
                        Historial de compras
                      </Link>
                      <Link className="btn ghost" href="/wishlist">
                        Mi lista de deseos
                      </Link>
                    </>
                  ) : (
                    <Link className="btn ghost" href="/admin">
                      Ir a Admin
                    </Link>
                  )}

                  <div
                    style={{
                      height: 1,
                      background: "var(--stroke)",
                      margin: "6px 0 4px",
                    }}
                  />
                  <button className="btn danger" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburguesa (solo móviles y tablets) */}
          <button
            className="hamburger inline-flex md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {open && (
        <div id="mobile-menu" className="mobile-menu md:hidden">
          <form
            className="search-form"
            role="search"
            aria-label="Buscar en el catálogo (móvil)"
          >
            <input
              type="search"
              placeholder="Buscar productos…"
              aria-label="Buscar productos"
            />
            <button type="submit" className="btn ghost">
              Buscar
            </button>
          </form>

          <nav className="mobile-links" aria-label="Principal móvil">
            <Link href="/productos" onClick={() => setOpen(false)}>
              Catálogo
            </Link>
            <Link href="/categorias" onClick={() => setOpen(false)}>
              Categorías
            </Link>
            <Link href="/sobre-nosotros" onClick={() => setOpen(false)}>
              Sobre nosotros
            </Link>
            <Link href="/contacto" onClick={() => setOpen(false)}>
              Contáctanos
            </Link>

            {/* Wishlist en móvil solo logueado */}
            {mounted && hasSession && isCliente && (
              <Link
                href="/wishlist"
                onClick={() => setOpen(false)}
                className="btn ghost"
              >
                Wishlist
              </Link>
            )}

            <Link
              href="/carrito"
              onClick={() => setOpen(false)}
              className="btn ghost"
            >
              Carrito
            </Link>

            {/* Bloque de sesión en móvil */}
            {!mounted ? null : !hasSession ? (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn primary"
              >
                Login
              </Link>
            ) : (
              <div className="grid gap-2 mt-2">
                {isCliente ? (
                  <>
                    <Link href="/cuenta" onClick={() => setOpen(false)}>
                      Mis datos
                    </Link>
                    <Link
                      href="/cuenta/historial"
                      onClick={() => setOpen(false)}
                    >
                      Historial de compras
                    </Link>
                    <Link href="/wishlist" onClick={() => setOpen(false)}>
                      Mi lista de deseos
                    </Link>
                  </>
                ) : (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    Ir a Admin
                  </Link>
                )}
                <button
                  className="btn danger"
                  onClick={async () => {
                    setOpen(false);
                    await signOut({ callbackUrl: "/" });
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
