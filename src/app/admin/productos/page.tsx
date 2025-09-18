"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos ===== */
type Categoria = { id: number; nombre: string };
type Imagen = { url: string; orden: number };

type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  publicado: boolean;
  publicadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  categoria?: Categoria | null;
  imagenes?: Imagen[];
};

type OrderField = "nombre" | "actualizado" | "creado";
type Dir = "asc" | "desc";
type Status = "activos" | "inactivos" | "todos";

/* ===== Iconos ===== */
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
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 5C4.367 5 1 12 1 12s3.367 7 11 7 11-7 11-7-3.367-7-11-7z"
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
function ToggleOn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 24" width="34" height="18" {...props} aria-hidden>
      <rect
        x="1"
        y="1"
        width="46"
        height="22"
        rx="11"
        stroke="currentColor"
        fill="currentColor"
      />
      <circle cx="35" cy="12" r="8" fill="white" />
    </svg>
  );
}
function ToggleOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 24" width="34" height="18" {...props} aria-hidden>
      <rect
        x="1"
        y="1"
        width="46"
        height="22"
        rx="11"
        stroke="currentColor"
        fill="none"
      />
      <circle cx="13" cy="12" r="8" fill="currentColor" />
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

/* ===== Helpers ===== */
const firstImage = (p: Producto) =>
  p.imagenes?.[0]?.url ?? p.imagenUrl ?? "/placeholder-product.png";

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString() : "-";

const StatusDot: React.FC<{ active: boolean; title?: string }> = ({
  active,
  title,
}) => (
  <span
    title={title}
    aria-hidden
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "999px",
      marginRight: 8,
      background: active ? "#16a34a" : "#dc2626", // verde / rojo
      boxShadow: "0 0 0 2px rgba(0,0,0,.06) inset",
      verticalAlign: "middle",
    }}
  />
);

/* ===== Página ===== */
export default function ProductosAdminPage() {
  const [rows, setRows] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros / ui
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("todos");
  const [order, setOrder] = useState<OrderField>("creado");
  const [dir, setDir] = useState<Dir>("desc");

  // paginación
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // detalle
  const [viewing, setViewing] = useState<Producto | null>(null);

  // editar
  type EditForm = {
    id: number | null;
    nombre: string;
    descripcion: string;
    idCategoria: string;
    imagenUrl: string;
    publicado: boolean;
  };
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditForm>({
    id: null,
    nombre: "",
    descripcion: "",
    idCategoria: "",
    imagenUrl: "",
    publicado: false,
  });

  const loadCategorias = async () => {
    try {
      const res = await fetch("/api/admin/categorias");
      if (!res.ok) return;
      const raw: unknown = await res.json();
      const list: Categoria[] = Array.isArray(raw)
        ? raw
            .map((r) => {
              if (!r || typeof r !== "object") return null;
              const o = r as Record<string, unknown>;
              const id = typeof o.id === "number" ? o.id : Number(o.id);
              const nombre = typeof o.nombre === "string" ? o.nombre : null;
              return Number.isFinite(id) && nombre ? { id, nombre } : null;
            })
            .filter((x): x is Categoria => x !== null)
        : [];
      setCategorias(list);
    } catch {
      setCategorias([]);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      sp.set("status", status);
      sp.set("order", order);
      sp.set("dir", dir);

      const res = await fetch(`/api/admin/productos?${sp.toString()}`);
      const raw: unknown = await res.json();
      setRows(Array.isArray(raw) ? (raw as Producto[]) : []);
      setPage(1);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategorias();
    void load();
  }, []);

  // paginado
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  const togglePublicado = async (p: Producto) => {
    const res = await fetch(`/api/admin/productos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !p.publicado }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "No se pudo actualizar el estado.");
      return;
    }
    await load();
  };

  const onDelete = async (p: Producto) => {
    if (!confirm(`¿Eliminar el producto “${p.nombre}” (#${p.id})?`)) return;
    const res = await fetch(`/api/admin/productos/${p.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "No se pudo eliminar.");
      return;
    }
    await load();
    alert("Producto eliminado.");
  };

  const exportListPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = rows.map((p) => [
      p.id,
      p.nombre,
      p.categoria?.nombre ?? "-",
      p.publicado ? "Activo" : "Inactivo",
      fmtDate(p.actualizadoEn),
    ]);
    doc.text("Productos - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nombre", "Categoría", "Estado", "Actualizado"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 26 },
        4: { cellWidth: 38 },
      },
    });
    doc.save("productos.pdf");
    alert("PDF generado.");
  };

  const openEdit = (p: Producto) => {
    setForm({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      idCategoria: p.categoria?.id ? String(p.categoria.id) : "",
      imagenUrl: p.imagenUrl ?? "",
      publicado: p.publicado,
    });
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id == null) return;

    const payload: {
      nombre?: string;
      descripcion?: string | null;
      imagenUrl?: string | null;
      idCategoria?: number | null;
      publicado?: boolean;
    } = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() ? form.descripcion.trim() : null,
      imagenUrl: form.imagenUrl.trim() ? form.imagenUrl.trim() : null,
      publicado: form.publicado,
    };

    if (form.idCategoria === "") {
      payload.idCategoria = null;
    } else {
      const n = Number(form.idCategoria);
      if (Number.isFinite(n)) payload.idCategoria = n;
    }

    const res = await fetch(`/api/admin/productos/${form.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const ejson = await res.json().catch(() => ({}));
      alert(ejson?.error ?? "No se pudo guardar.");
      return;
    }

    setEditOpen(false);
    await load();
    alert("Producto actualizado.");
  };

  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

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
            <span className="muted">Total: {count}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="icon-btn"
              title="Exportar PDF"
              aria-label="Exportar PDF"
              onClick={exportListPDF}
            >
              <PdfIcon />
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              className="input"
              placeholder="Buscar por nombre o descripción…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />

            <span className="muted">Estado:</span>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>

            <span className="muted">Orden:</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as OrderField)}
              style={{ width: 160 }}
            >
              <option value="creado">Más recientes</option>
              <option value="actualizado">Actualizados</option>
              <option value="nombre">Nombre</option>
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

      {/* Tabla compacta */}
      <div className="panel p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>ID</th>
              <th style={{ width: 72 }}>Imagen</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th style={{ width: 170, textAlign: "center" }}>
                <span
                  title="Habilita/oculta la ficha en la web"
                  className="inline-block font-semibold"
                >
                  Publicado
                </span>
              </th>
              <th style={{ width: 180 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  <img
                    src={firstImage(p)}
                    alt={p.nombre}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </td>
                <td>{p.nombre}</td>
                <td>{p.categoria?.nombre ?? "-"}</td>
                <td className="text-center">
                  <div className="inline-flex items-center">
                    <StatusDot
                      active={p.publicado}
                      title={p.publicado ? "Activo" : "Inactivo"}
                    />
                    <button
                      className="icon-btn"
                      title={p.publicado ? "Despublicar" : "Publicar"}
                      onClick={() => void togglePublicado(p)}
                      aria-label={p.publicado ? "Despublicar" : "Publicar"}
                    >
                      {p.publicado ? <ToggleOn /> : <ToggleOff />}
                    </button>
                  </div>
                </td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(p)}
                  >
                    <EyeIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(p)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => void onDelete(p)}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted text-center p-4">
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
          <div className="muted">
            Página {pageSafe} / {totalPages}
          </div>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
          >
            Siguiente »
          </button>
        </div>
      </div>

      {/* Modal de detalle */}
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
              color: "var(--ink)",
              margin: "5% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(720px, 96%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de producto</h3>
              <button className="icon-btn" onClick={() => setViewing(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="grid gap-2">
              <div>
                <b>ID:</b> {viewing.id}
              </div>
              <div>
                <b>Nombre:</b> {viewing.nombre}
              </div>
              <div>
                <b>Categoría:</b> {viewing.categoria?.nombre ?? "-"}
              </div>
              <div>
                <b>Publicado:</b> {viewing.publicado ? "Sí" : "No"}
              </div>
              <div>
                <b>Publicado en:</b> {fmtDate(viewing.publicadoEn)}
              </div>
              <div>
                <b>Creado:</b> {fmtDate(viewing.creadoEn)}
              </div>
              <div>
                <b>Actualizado:</b> {fmtDate(viewing.actualizadoEn)}
              </div>
              {firstImage(viewing) && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={firstImage(viewing)}
                    alt={viewing.nombre}
                    style={{
                      maxWidth: 240,
                      maxHeight: 240,
                      objectFit: "cover",
                      borderRadius: 10,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer editar */}
      {editOpen && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,.45)",
              backdropFilter: "blur(1px)",
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
              width: "min(560px, 92vw)",
              background: "var(--panel)",
              color: "var(--ink)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
              display: "grid",
              gridTemplateRows: "auto 1fr",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Editar producto</h3>
              <button className="btn ghost" onClick={() => setEditOpen(false)}>
                Cerrar
              </button>
            </div>

            <form className="grid gap-3" onSubmit={submitEdit}>
              <label className="grid gap-1">
                <span>Nombre</span>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, nombre: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="grid gap-1">
                <span>Descripción</span>
                <textarea
                  className="input"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, descripcion: e.target.value }))
                  }
                />
              </label>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Categoría</span>
                  <select
                    className="input"
                    value={form.idCategoria}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, idCategoria: e.target.value }))
                    }
                  >
                    <option value="">—</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span>Publicado</span>
                  <div className="flex items-center gap-2">
                    <StatusDot active={form.publicado} />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() =>
                        setForm((s) => ({ ...s, publicado: !s.publicado }))
                      }
                      aria-label={form.publicado ? "Despublicar" : "Publicar"}
                      title={form.publicado ? "Despublicar" : "Publicar"}
                    >
                      {form.publicado ? <ToggleOn /> : <ToggleOff />}
                    </button>
                  </div>
                </label>
              </div>

              <label className="grid gap-1">
                <span>Imagen (URL)</span>
                <input
                  className="input"
                  type="url"
                  value={form.imagenUrl}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, imagenUrl: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </label>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setEditOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
