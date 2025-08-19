"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ui/theme-toggle";
import { signOut } from "next-auth/react";

type Props = {
  onToggleSidebar?: () => void;
};

export default function AdminHeader({ onToggleSidebar }: Props) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Botón menú (móvil) */}
        <button
          className="hamburger md:hidden"
          aria-label="Abrir menú"
          onClick={onToggleSidebar}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Marca */}
        <Link
          href="/admin"
          className="brand"
          aria-label="Ir al dashboard de Admin"
        >
          <Image
            src="/beso-logo.png"
            alt="BESO Admin"
            width={36}
            height={36}
            className="brand-logo"
            priority
          />
          <span className="brand-name">BESO · Admin</span>
        </Link>

        {/* Acciones derechas */}
        <div
          className="right-actions"
          style={{ display: "flex", gap: ".5rem" }}
        >
          <ThemeToggle />
          <button className="btn ghost" aria-label="Cerrar sesión">
            Administrador
          </button>
        </div>
      </div>
    </header>
  );
}
