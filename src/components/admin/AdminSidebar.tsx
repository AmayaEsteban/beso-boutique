"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  onNavigate?: () => void; // para cerrar el drawer en móvil al hacer click
};

export default function AdminSidebar({ onNavigate }: Props) {
  const Item = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      onClick={onNavigate}
      className="admin-nav-item"
      aria-label={
        typeof children === "string" ? (children as string) : undefined
      }
    >
      {children}
    </Link>
  );

  return (
    <nav className="admin-nav">
      <Item href="/admin/productos">Productos</Item>
      <Item href="/admin/categorias">Categorias</Item>
      <Item href="/admin/clientes">Clientes</Item>
      <Item href="/admin/usuarios">Usuarios</Item>
      <Item href="/admin/ventas-online">Ventas online</Item>
      <Item href="/admin/ventas-tienda">Ventas En tienda</Item>
      <Item href="/admin/proveedores">Proveedores</Item>
      <Item href="/admin/reportes">Reportes</Item>
      <Item href="/admin/configuracion">Configuracion</Item>
      <Item href="/admin/seguridad">Seguridad</Item>

      <button
        className="admin-nav-item danger"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Log-out
      </button>
    </nav>
  );
}
