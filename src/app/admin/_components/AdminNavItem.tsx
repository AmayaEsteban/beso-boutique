// src/app/admin/_components/AdminNavItem.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string; // SIEMPRE el definitivo (p.ej. "/admin/inventario/movimientos")
  label: string; // texto fijo
  onNavigate?: () => void;
};

export default function AdminNavItem({ href, label, onNavigate }: Props) {
  const pathname = usePathname(); // sólo para “active”, no para reescribir href
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`admin-nav-item${active ? " active" : ""}`}
      aria-label={label}
    >
      {label}
    </Link>
  );
}
