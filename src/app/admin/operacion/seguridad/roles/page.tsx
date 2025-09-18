"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos ===== */
type Dir = "asc" | "desc";
type OrderField = "id" | "nombre" | "fecha";

type RolRow = {
  idRol: number;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: string; // ISO
  usuariosCount: number;
  permisosCount: number;
};

type PermisoModulo = {
  modulo: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
};

/* ===== Catálogo de módulos ===== */
const MODULOS: string[] = [
  // Operación
  "seguridad.usuarios",
  "seguridad.roles",
  "clientes",
  "compras",
  "inventario.movimientos",
  "devoluciones.proveedor",
  "pagos.proveedor",
  "clasificacion.abc",
  // Marketing & CMS
  "cms.banners",
  "cms.paginas",
  "cms.sobre",
  "marketing.faqs",
  "marketing.newsletter",
  "marketing.contacto",
  // Catálogo
  "catalogo.productos",
  "catalogo.variantes",
  "catalogo.colores",
  "catalogo.tallas",
];

/* ===== Iconos (SVG, heredan currentColor) ===== */
function PdfIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="7" y="17" fontSize="7" fontWeight="700">
        PDF
      </text>
    </svg>
  );
}
function CsvPinkoIcon(props: React.SVGProps<SVGSVGElement>) {
  // “Pinko”: archivo con un círculo “punto rosa” y texto CSV
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v14.5A1.5 1.5 0 0 0 5.5 20H18a2 2 0 0 0 2-2V8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="15.5" r="1.8" fill="currentColor" />
      <text x="6.2" y="15.8" fontSize="6.2" fontWeight="700">
        CSV
      </text>
    </svg>
  );
}
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ViewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 5c-7.633 0-11 7-11 7s3.367 7 11 7 11-7 11-7-3.367-7-11-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14.06 4.94l3.75 3.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M3 6h18M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props} aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ShieldKeyIcon(props: React.SVGProps<SVGSVGElement>) {
  // Icono compacto para “Asignar permisos”
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M13.5 12.2a2.2 2.2 0 10-2.2 2.2h.6l1.1 1.1 1.1-1.1V14a1.8 1.8 0 00-.6-1.8z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ===== Página ===== */
export default function RolesAdminPage() {
  const [rows, setRows] = useState<RolRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // filtros
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [q, setQ] = useState<string>("");
  const [order, setOrder] = useState<OrderField>("id");
  const [dir, setDir] = useState<Dir>("desc");

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // drawers/modales
  const [open, setOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<RolRow | null>(null);
  const [nombre, setNombre] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");

  const [permOpen, setPermOpen] = useState<boolean>(false);
  const [permRol, setPermRol] = useState<RolRow | null>(null);
  const [permisos, setPermisos] = useState<PermisoModulo[]>([]);

  // detalle rápido
  const [viewing, setViewing] = useState<RolRow | null>(null);

  const load = async (): Promise<void> => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("order", order);
    sp.set("dir", dir);
    const res = await fetch(`/api/admin/operacion/roles?${sp.toString()}`);
    const data = (await res.json()) as RolRow[];
    setRows(data);
    setPage(1);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  // paginado
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  /* ===== CSV/PDF ===== */
  const exportCSV = (): void => {
    const header =
      "idRol,nombre,descripcion,fecha_creacion,usuarios,permisos\n";
    const body = rows
      .map(
        (r) =>
          `${r.idRol},"${(r.nombre || "").replace(/"/g, '""')}","${(
            r.descripcion || ""
          ).replace(/"/g, '""')}",${new Date(r.fecha_creacion).toISOString()},${
            r.usuariosCount
          },${r.permisosCount}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roles.csv";
    a.click();
    URL.revokeObjectURL(url);
    alert("CSV exportado.");
  };

  const exportPDF = (): void => {
    const doc = new jsPDF();
    doc.text("Roles — BESO", 14, 14);
    const body: RowInput[] = rows.map((r) => [
      r.idRol,
      r.nombre,
      r.descripcion ?? "—",
      r.usuariosCount,
      r.permisosCount,
      new Date(r.fecha_creacion).toLocaleString(),
    ]);
    autoTable(doc, {
      startY: 20,
      head: [
        ["ID", "Nombre", "Descripción", "Usuarios", "Permisos", "Creación"],
      ],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("roles.pdf");
    alert("PDF generado.");
  };

  /* ===== CRUD Rol ===== */
  const openNew = (): void => {
    setEditing(null);
    setNombre("");
    setDescripcion("");
    setOpen(true);
  };
  const openEdit = (r: RolRow): void => {
    setEditing(r);
    setNombre(r.nombre);
    setDescripcion(r.descripcion ?? "");
    setOpen(true);
  };
  const save = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert("Nombre requerido");
      return;
    }
    const url = editing
      ? `/api/admin/operacion/roles/${editing.idRol}`
      : `/api/admin/operacion/roles`;
    const method: "PUT" | "POST" = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() ? descripcion.trim() : null,
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      alert(err?.error ?? "Error al guardar");
      return;
    }
    setOpen(false);
    await load();
    alert(editing ? "Rol actualizado." : "Rol creado.");
  };

  const onDelete = async (r: RolRow): Promise<void> => {
    if (!confirm(`Eliminar rol ${r.nombre}?`)) return;
    const res = await fetch(`/api/admin/operacion/roles/${r.idRol}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      alert(err?.error ?? "No se pudo eliminar");
      return;
    }
    await load();
    alert("Rol eliminado.");
  };

  /* ===== Permisos ===== */
  const openPerms = async (r: RolRow): Promise<void> => {
    setPermRol(r);
    // base: todos los módulos en false
    const base: PermisoModulo[] = MODULOS.map((m) => ({
      modulo: m,
      puede_ver: false,
      puede_crear: false,
      puede_editar: false,
      puede_eliminar: false,
    }));
    // fetch actuales
    const res = await fetch(`/api/admin/operacion/roles/${r.idRol}/permisos`);
    const current = (await res.json()) as PermisoModulo[];
    const merged = base.map((b) => {
      const found = current.find((c) => c.modulo === b.modulo);
      return found ? found : b;
    });
    setPermisos(merged);
    setPermOpen(true);
  };

  const setRow = (idx: number, patch: Partial<PermisoModulo>): void => {
    setPermisos((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    );
  };

  const toggleAllRow = (idx: number, on: boolean): void => {
    setRow(idx, {
      puede_ver: on,
      puede_crear: on,
      puede_editar: on,
      puede_eliminar: on,
    });
  };

  const savePerms = async (): Promise<void> => {
    if (!permRol) return;
    const payload: PermisoModulo[] = permisos.map((p) => ({
      modulo: p.modulo,
      puede_ver: !!p.puede_ver,
      puede_crear: !!p.puede_crear,
      puede_editar: !!p.puede_editar,
      puede_eliminar: !!p.puede_eliminar,
    }));
    const res = await fetch(
      `/api/admin/operacion/roles/${permRol.idRol}/permisos`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      alert(err?.error ?? "No se pudieron guardar permisos");
      return;
    }
    setPermOpen(false);
    await load();
    alert("Permisos guardados.");
  };

  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Seguridad — Roles</h1>

      {/* Barra superior */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="btn ghost"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
            <span className="muted">Total: {rows.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="icon-btn"
              onClick={exportCSV}
              title="Exportar CSV"
              aria-label="Exportar CSV"
            >
              <CsvPinkoIcon />
            </button>
            <button
              className="icon-btn"
              onClick={exportPDF}
              title="Exportar PDF"
              aria-label="Exportar PDF"
            >
              <PdfIcon />
            </button>
            <button className="btn primary" onClick={openNew}>
              <PlusIcon style={{ marginRight: 8 }} />
              Nuevo rol
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              className="input"
              placeholder="Buscar por nombre/descripcion…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <span className="muted">Orden:</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as OrderField)}
              style={{ width: 140 }}
            >
              <option value="id">ID</option>
              <option value="nombre">Nombre</option>
              <option value="fecha">Fecha</option>
            </select>
            <select
              className="input"
              value={dir}
              onChange={(e) => setDir(e.target.value as Dir)}
              style={{ width: 110 }}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button className="btn" onClick={load} disabled={loading}>
              Filtrar
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="muted">Ver:</span>
              <select
                className="input"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ width: 90 }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="panel p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th style={{ width: 120 }}>Usuarios</th>
              <th style={{ width: 120 }}>Permisos</th>
              <th style={{ width: 200 }}>Creación</th>
              <th style={{ width: 180 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.idRol}>
                <td>{r.idRol}</td>
                <td>{r.nombre}</td>
                <td>{r.descripcion ?? "—"}</td>
                <td>{r.usuariosCount}</td>
                <td>{r.permisosCount}</td>
                <td>{new Date(r.fecha_creacion).toLocaleString()}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(r)}
                    aria-label="Ver rol"
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(r)}
                    aria-label="Editar rol"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Asignar permisos"
                    aria-label="Asignar permisos"
                    onClick={() => void openPerms(r)}
                  >
                    <ShieldKeyIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => void onDelete(r)}
                    aria-label="Eliminar rol"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="muted text-center p-4">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="panel p-3 mt-3 flex items-center justify-between">
        <div className="muted">
          Mostrando {count ? start + 1 : 0}-{end} de {count}
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe <= 1}
          >
            « Anterior
          </button>
        </div>
        <div className="muted">
          Página {pageSafe} / {totalPages}
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
          >
            Siguiente »
          </button>
        </div>
      </div>

      {/* Modal Detalle */}
      {viewing && (
        <div
          className="modal-root"
          onClick={() => setViewing(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 2000,
          }}
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              background: "var(--panel)",
              margin: "5% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(560px, 92%)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de rol</h3>
              <button
                className="icon-btn"
                onClick={() => setViewing(null)}
                title="Cerrar"
                aria-label="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>
            <p>
              <b>ID:</b> {viewing.idRol}
            </p>
            <p>
              <b>Nombre:</b> {viewing.nombre}
            </p>
            <p>
              <b>Descripción:</b> {viewing.descripcion ?? "—"}
            </p>
            <p>
              <b>Usuarios:</b> {viewing.usuariosCount}
            </p>
            <p>
              <b>Permisos:</b> {viewing.permisosCount}
            </p>
            <p>
              <b>Creación:</b>{" "}
              {new Date(viewing.fecha_creacion).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Drawer crear/editar rol */}
      {open && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,.45)",
            }}
          />
          <div
            className="admin-right-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="document"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "min(520px, 92vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
              display: "grid",
              gridTemplateRows: "auto 1fr",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">
                {editing ? "Editar rol" : "Nuevo rol"}
              </h3>
              <button
                className="icon-btn"
                onClick={() => setOpen(false)}
                title="Cerrar"
                aria-label="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <form className="grid gap-3" onSubmit={save}>
              <label className="grid gap-1">
                <span>Nombre</span>
                <input
                  className="input"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1">
                <span>Descripción</span>
                <textarea
                  className="input"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </label>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  {editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer permisos */}
      {permOpen && permRol && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          onClick={() => setPermOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1100 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,.45)",
            }}
          />
          <div
            className="admin-right-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="document"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "min(760px, 95vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Permisos — {permRol.nombre}</h3>
              <button
                className="icon-btn"
                onClick={() => setPermOpen(false)}
                title="Cerrar"
                aria-label="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="panel p-3">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "1fr repeat(5, auto)",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div className="muted" />
                <div className="muted text-center">Todos</div>
                <div className="muted text-center">Ver</div>
                <div className="muted text-center">Crear</div>
                <div className="muted text-center">Editar</div>
                <div className="muted text-center">Eliminar</div>

                {permisos.map((p, i) => {
                  const allOn =
                    p.puede_ver &&
                    p.puede_crear &&
                    p.puede_editar &&
                    p.puede_eliminar;
                  return (
                    <React.Fragment key={p.modulo}>
                      <div style={{ fontWeight: 600 }}>{p.modulo}</div>
                      <div className="text-center">
                        <input
                          type="checkbox"
                          checked={allOn}
                          onChange={(e) => toggleAllRow(i, e.target.checked)}
                        />
                      </div>
                      <div className="text-center">
                        <input
                          type="checkbox"
                          checked={p.puede_ver}
                          onChange={(e) =>
                            setRow(i, { puede_ver: e.target.checked })
                          }
                        />
                      </div>
                      <div className="text-center">
                        <input
                          type="checkbox"
                          checked={p.puede_crear}
                          onChange={(e) =>
                            setRow(i, { puede_crear: e.target.checked })
                          }
                        />
                      </div>
                      <div className="text-center">
                        <input
                          type="checkbox"
                          checked={p.puede_editar}
                          onChange={(e) =>
                            setRow(i, { puede_editar: e.target.checked })
                          }
                        />
                      </div>
                      <div className="text-center">
                        <input
                          type="checkbox"
                          checked={p.puede_eliminar}
                          onChange={(e) =>
                            setRow(i, { puede_eliminar: e.target.checked })
                          }
                        />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  className="btn ghost"
                  onClick={() => setPermOpen(false)}
                >
                  Cancelar
                </button>
                <button className="btn primary" onClick={savePerms}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
