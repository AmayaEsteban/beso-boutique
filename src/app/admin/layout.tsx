"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // mide la altura real del header y la expone como --header-h
  useEffect(() => {
    const setHeaderVar = () => {
      const el =
        (document.querySelector("#admin-header") as HTMLElement) ||
        (document.querySelector(".admin-header") as HTMLElement);
      const h = el?.offsetHeight ?? 64;
      document.documentElement.style.setProperty("--header-h", `${h}px`);
    };
    setHeaderVar();
    const ro = new ResizeObserver(setHeaderVar);
    const target =
      (document.querySelector("#admin-header") as HTMLElement) ||
      (document.querySelector(".admin-header") as HTMLElement);
    if (target) ro.observe(target);
    const onResize = () => setHeaderVar();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // si cambias a desktop, cierra el drawer móvil
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && open) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // bloquear scroll del body cuando drawer abierto
  useEffect(() => {
    if (open) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [open]);

  return (
    <>
      <div id="admin-header">
        <AdminHeader onToggleSidebar={() => setOpen((v) => !v)} />
      </div>

      <div className={`admin-shell ${open ? "drawer-open" : ""}`}>
        {/* Sidebar fijo (desktop) / drawer (móvil) */}
        <aside
          className={`admin-sidebar ${open ? "is-open open-all" : ""}`}
          aria-label="Menú administrador"
        >
          {/* IMPORTANTE: AdminSidebar ya NO rinde su propio <aside> */}
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </aside>

        {/* Contenido */}
        <main className="admin-content" role="main">
          {children}
        </main>

        {/* Backdrop móvil */}
        {open && (
          <button
            className="admin-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          />
        )}
      </div>
    </>
  );
}
