// src/app/admin/_components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

/* =========================
   Utilidad: saber si montó
========================= */
function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/* =========================
   NavItem (link del menú)
========================= */
type NavItemProps = {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
};

function NavItem({ href, children, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const active = useMemo(() => pathname === href, [pathname, href]);

  const aria = typeof children === "string" ? (children as string) : undefined;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`admin-nav-item${active ? " active" : ""}`}
      aria-label={aria}
    >
      {children}
    </Link>
  );
}

/* =========================
   Group (acordeón estable)
   - SSR/primer render: cerrado
   - Después de montar: lee y guarda en localStorage
========================= */
type GroupProps = {
  id: string; // clave persistente: ej. "catalogo", "ventas"
  title: string;
  children: React.ReactNode;
  // Sugerencia por defecto (se aplica tras montar, no en SSR)
  defaultOpen?: boolean;
};

function Group({ id, title, children, defaultOpen = false }: GroupProps) {
  const mounted = useIsMounted();
  const [open, setOpen] = useState(false); // SSR + 1er render cliente => cerrado

  // Tras montar, sincroniza con localStorage o defaultOpen
  useEffect(() => {
    const key = `nav:${id}`;
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (saved === "1" || (saved === null && defaultOpen)) setOpen(true);
  }, [id, defaultOpen]);

  // Persiste cambios al abrir/cerrar (solo cliente montado)
  useEffect(() => {
    if (!mounted) return;
    const key = `nav:${id}`;
    localStorage.setItem(key, open ? "1" : "0");
  }, [id, open, mounted]);

  return (
    <div className="admin-nav-group">
      <button
        type="button"
        className="admin-nav-group-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={mounted ? open : false}
      >
        <span>{title}</span>
        <span className="chev" aria-hidden>
          {mounted && open ? "▾" : "▸"}
        </span>
      </button>

      {/* En desktop se respeta el acordeón; en móvil la clase `open-all` del <aside> lo puede forzar vía CSS */}
      <div
        className="admin-nav-group-body"
        style={{ display: mounted && open ? "block" : "none" }}
      >
        {children}
      </div>
    </div>
  );
}

/* =========================
   Sidebar
========================= */
type Props = { onNavigate?: () => void };

export default function AdminSidebar({ onNavigate }: Props) {
  // ⛔️ Importante: este componente sólo devuelve el contenido interno (sin <aside/>).
  return (
    <>
      {/* contenido scrollable */}
      <div className="admin-sidebar-scroll">
        <nav className="admin-nav">
          {/* Fijos arriba */}
          <NavItem href="/admin/usuarios" onNavigate={onNavigate}>
            Usuarios
          </NavItem>
          <NavItem href="/admin/clientes" onNavigate={onNavigate}>
            Clientes
          </NavItem>

          {/* Catálogo */}
          <Group id="catalogo" title="Catálogo" defaultOpen>
            <NavItem href="/admin/catalogo" onNavigate={onNavigate}>
              Productos
            </NavItem>
            <NavItem href="/admin/categorias" onNavigate={onNavigate}>
              Categorías
            </NavItem>
            <NavItem href="/admin/colores" onNavigate={onNavigate}>
              Colores
            </NavItem>
            <NavItem href="/admin/tallas" onNavigate={onNavigate}>
              Tallas
            </NavItem>
            <NavItem href="/admin/productos" onNavigate={onNavigate}>
              Publicación
            </NavItem>
            <NavItem href="/admin/imagenes-productos" onNavigate={onNavigate}>
              Imágenes de Productos
            </NavItem>
            <NavItem href="/admin/clasificacion-abc" onNavigate={onNavigate}>
              Clasificación ABC
            </NavItem>
          </Group>

          {/* Ventas */}
          <Group id="ventas" title="Ventas">
            <NavItem href="/admin/ventas-online" onNavigate={onNavigate}>
              Ventas online
            </NavItem>
            <NavItem href="/admin/ventas-tienda" onNavigate={onNavigate}>
              Ventas en tienda
            </NavItem>
            <NavItem href="/admin/pagos" onNavigate={onNavigate}>
              Pagos
            </NavItem>
            <NavItem href="/admin/envios" onNavigate={onNavigate}>
              Envíos
            </NavItem>
            <NavItem href="/admin/cupones" onNavigate={onNavigate}>
              Cupones
            </NavItem>
          </Group>

          {/* Inventario & Proveedores */}
          <Group id="inventario-proveedores" title="Inventario & Proveedores">
            <NavItem
              href="/admin/inventario/movimientos"
              onNavigate={onNavigate}
            >
              Movimientos de Inventario
            </NavItem>
            <NavItem href="/admin/proveedores" onNavigate={onNavigate}>
              Proveedores
            </NavItem>
            <NavItem href="/admin/compras" onNavigate={onNavigate}>
              Compras
            </NavItem>
            <NavItem href="/admin/pagos-proveedor" onNavigate={onNavigate}>
              Pagos a Proveedor
            </NavItem>
            <NavItem
              href="/admin/devoluciones-proveedor"
              onNavigate={onNavigate}
            >
              Devoluciones a Proveedor
            </NavItem>
          </Group>

          {/* Marketing & CMS */}
          <Group id="marketing-cms" title="Marketing & CMS">
            <NavItem href="/admin/banners" onNavigate={onNavigate}>
              Banners
            </NavItem>
            <NavItem href="/admin/paginas" onNavigate={onNavigate}>
              Páginas CMS
            </NavItem>
            <NavItem href="/admin/faqs" onNavigate={onNavigate}>
              FAQs
            </NavItem>
            <NavItem href="/admin/sobre" onNavigate={onNavigate}>
              Sobre Nosotros
            </NavItem>
            <NavItem href="/admin/contacto" onNavigate={onNavigate}>
              Contacto
            </NavItem>
            <NavItem href="/admin/mensajes-contacto" onNavigate={onNavigate}>
              Mensajes de Contacto
            </NavItem>
            <NavItem href="/admin/newsletter" onNavigate={onNavigate}>
              Newsletter
            </NavItem>
            <NavItem href="/admin/resenas" onNavigate={onNavigate}>
              Reseñas
            </NavItem>
            <NavItem href="/admin/listas-deseos" onNavigate={onNavigate}>
              Listas de Deseos
            </NavItem>
          </Group>

          {/* Operación */}
          <Group id="operacion" title="Operación">
            <NavItem href="/admin/reportes" onNavigate={onNavigate}>
              Reportes
            </NavItem>
            <NavItem href="/admin/configuracion" onNavigate={onNavigate}>
              Configuración
            </NavItem>
            <NavItem
              href="/admin/operacion/seguridad/roles"
              onNavigate={onNavigate}
            >
              Seguridad (Roles)
            </NavItem>
            <NavItem href="/admin/auditoria" onNavigate={onNavigate}>
              Auditoría
            </NavItem>
          </Group>
        </nav>
      </div>

      {/* footer fijo */}
      <div className="admin-sidebar-footer">
        <button
          className="admin-nav-item danger"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Log-out
        </button>
      </div>
    </>
  );
}
