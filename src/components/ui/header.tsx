"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function Header() {
  const [open, setOpen] = useState(false);

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

          {/* Login */}
          <Link href="/login" className="btn primary" aria-label="Ir al login">
            Login
          </Link>

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
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn primary"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
