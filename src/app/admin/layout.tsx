"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdminHeader onToggleSidebar={() => setOpen((v) => !v)} />

      <div className="admin-shell">
        <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </aside>
        {open && (
          <div
            className="admin-fallback-list"
            role="menu"
            aria-label="Menú administrador"
          >
            <a href="/admin/productos" className="admin-fallback-item">
              Productos
            </a>
            <a href="/admin/categorias" className="admin-fallback-item">
              Categorias
            </a>
            <a href="/admin/clientes" className="admin-fallback-item">
              Clientes
            </a>
            <a href="/admin/usuarios" className="admin-fallback-item">
              Usuarios
            </a>
            <a href="/admin/ventas-online" className="admin-fallback-item">
              Ventas online
            </a>
            <a href="/admin/ventas-tienda" className="admin-fallback-item">
              Ventas En tienda
            </a>
            <a href="/admin/proveedores" className="admin-fallback-item">
              Proveedores
            </a>
            <a href="/admin/reportes" className="admin-fallback-item">
              Reportes
            </a>
            <a href="/admin/configuracion" className="admin-fallback-item">
              Configuracion
            </a>
            <a href="/admin/seguridad" className="admin-fallback-item">
              Seguridad
            </a>

            <button
              className="admin-fallback-item danger"
              onClick={() => location.assign("/api/auth/signout?callbackUrl=/")}
            >
              Log-out
            </button>
          </div>
        )}

        <section className="admin-content">{children}</section>
      </div>

      {/* Backdrop para móvil */}
      {open && (
        <button
          className="admin-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        />
      )}
    </>
  );
}
