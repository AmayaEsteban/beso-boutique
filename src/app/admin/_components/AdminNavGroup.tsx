// src/app/admin/_components/AdminNavGroup.tsx
"use client";

import { useEffect, useState } from "react";
import { useIsMounted } from "./hooks/useIsMounted";

type Props = {
  id: string; // clave para guardar estado (p.ej. "inv-proveedores")
  title: string;
  children: React.ReactNode; // NavItems dentro
};

export default function AdminNavGroup({ id, title, children }: Props) {
  const mounted = useIsMounted();
  const [open, setOpen] = useState(false); // SSR y 1er render cliente = cerrado

  // post-hidratación, lee preferencia guardada
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(`nav:${id}`) : null;
    if (saved === "1") setOpen(true);
  }, [id]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(`nav:${id}`, open ? "1" : "0");
  }, [id, open, mounted]);

  return (
    <div className="admin-nav-group">
      <button
        type="button"
        className="admin-nav-group-btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className="chev" aria-hidden>
          ▾
        </span>
      </button>

      {/* Importante: el contenedor de items permanece oculto en SSR y en 1er render cliente.
         Luego, tras montar, se abre si 'open' es true. */}
      <div
        className="admin-nav-group-items"
        style={{ display: mounted && open ? "block" : "none" }}
      >
        {children}
      </div>
    </div>
  );
}
