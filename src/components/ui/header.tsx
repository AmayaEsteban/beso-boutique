"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useSession, signOut } from "next-auth/react";

/* Icono simple de usuario */
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" fill="none" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" fill="none" />
    </svg>
  );
}

type Role = "CLIENTE" | "ADMIN" | "EMPLEADO" | "PROVEEDOR" | undefined;

export default function Header() {
  const [open, setOpen] = useState(false); // menú móvil
  const [menuOpen, setMenuOpen] = useState(false); // dropdown usuario (desktop)

  const { data: session, status } = useSession();
  const role = (session?.user as { role?: Role } | undefined)?.role;
  const hasSession = status === "authenticated";
  const isCliente = role === "CLIENTE";

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

  const firstName = (session?.user?.name ?? session?.user?.email ?? "Mi cuenta")
    .toString()
    .split(" ")[0];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

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
          style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
        >
          {/* Enlaces (desktop) */}
          <nav className="nav-links hidden md:flex" aria-label="Principal">
            <Link href="/productos">Catálogo</Link>
            <Link href="/categorias">Categorías</Link>
            <Link href="/sobre-nosotros">Sobre nosotros</Link>
            <Link href="/contacto">Contáctanos</Link>
          </nav>

          {/* Tema */}
          <ThemeToggle />

          {/* Carrito */}
          <Link
            href="/carrito"
            className="icon-button cart-button"
            aria-label="Carrito"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 18a2 2 0 1 0 0 4a2 2 0 0 0 0-4m10 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4M7.2 6l.6 3h10.9a1 1 0 0 1 1 .8l1 5a1 1 0 0 1-1 1.2H8a1 1 0 0 1-1-.8L5.1 4H3a1 1 0 1 1 0-2h3a1 1 0 0 1 1 .8L7.2 6Z"
              />
            </svg>
            <span className="cart-badge" aria-hidden="true">
              2
            </span>
          </Link>

          {/* Login / Menú usuario (desktop) */}
          {!hasSession ? (
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

                  {/* Opciones para cliente */}
                  {isCliente ? (
                    <>
                      <Link className="btn ghost" href="/cuenta">
                        Mis datos
                      </Link>
                      <Link className="btn ghost" href="/cuenta/historial">
                        Historial de compras
                      </Link>
                    </>
                  ) : (
                    // Para otros roles podrías llevarlos al admin
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
            <Link
              href="/carrito"
              onClick={() => setOpen(false)}
              className="btn ghost"
            >
              Carrito
            </Link>

            {/* Bloque de sesión en móvil */}
            {!hasSession ? (
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
