"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar"; // ajusta la ruta si difiere

export default function AdminMobileDrawer() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* Botón hamburguesa (solo móvil) */}
      <button
        className="hamburger md:hidden"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-controls="admin-drawer"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Drawer móvil con TU sidebar dentro */}
      <div id="admin-drawer" className="admin-drawer" data-open={open}>
        <div className="admin-drawer-backdrop" onClick={close} />
        <aside className="admin-drawer-panel">
          <AdminSidebar onNavigate={close} />
        </aside>
      </div>
    </>
  );
}
