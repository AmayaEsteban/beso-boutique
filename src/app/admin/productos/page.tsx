// src/app/admin/productos/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import type { Prisma, Categoria as CategoriaModel } from "@prisma/client";

/* ==== Tipos ==== */
type Producto = Prisma.ProductoGetPayload<{ include: { categoria: true } }>;
type Categoria = CategoriaModel;

type OrderField = "id" | "nombre" | "precio";
type Dir = "asc" | "desc";

/** Formulario SOLO con campos editables del producto (no stock/talla/color). */
type FormState = {
  nombre: string;
  descripcion: string;
  precio: string; // se parsea a number al enviar
  imagenUrl: string;
  idCategoria: string; // select -> se convierte a number | undefined
};

/* ==== Iconos ligeros (inline) ==== */
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

/* ==== Utils ==== */
const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  try {
    return parseFloat(String(v));
  } catch {
    return NaN;
  }
};

export default function ProductosPage() {
  /* ===== Estado ===== */
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [order, setOrder] = useState<OrderField>("id");
  const [dir, setDir] = useState<Dir>("desc");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // categorías para el select
  const [cats, setCats] = useState<Categoria[]>([]);

  // modal ver detalle
  const [viewing, setViewing] = useState<Producto | null>(null);

  // drawer crear/editar
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    descripcion: "",
    precio: "",
    imagenUrl: "",
    idCategoria: "",
  });

  /* ===== Cargar categorías ===== */
  const fetchCategorias = async () => {
    try {
      const res = await fetch("/api/admin/categorias");
      if (!res.ok) return;
      const data = (await res.json()) as Categoria[];
      setCats(data);
    } catch {
      // silencioso
    }
  };

  /* ===== Cargar productos ===== */
  const fetchProductos = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (categoria) sp.set("categoria", categoria);
    sp.set("order", order);
    sp.set("dir", dir);

    const res = await fetch(`/api/admin/productos?${sp.toString()}`);
    const data = (await res.json()) as Producto[];
    setItems(data);
    setLoading(false);
    setPage(1); // reset paginación al filtrar
  };

  useEffect(() => {
    void fetchCategorias();
  }, []);
  useEffect(() => {
    void fetchProductos();
  }, []);

  /* ===== Crear / Editar producto ===== */
  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: "",
      descripcion: "",
      precio: "",
      imagenUrl: "",
      idCategoria: "",
    });
    setOpenModal(true);
  };

  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({
      nombre: p.nombre ?? "",
      descripcion: p.descripcion ?? "",
      precio: String(toNumber(p.precio)),
      imagenUrl: p.imagenUrl ?? "",
      idCategoria: p.categoriaId ? String(p.categoriaId) : "",
    });
    setOpenModal(true);
  };

  const closeModal = () => setOpenModal(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre es requerido.");
      return;
    }
    const precioNum =
      form.precio.trim() === "" ? null : Number(form.precio.trim());
    if (precioNum === null || Number.isNaN(precioNum) || precioNum < 0) {
      alert("Precio inválido.");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() ? form.descripcion.trim() : null,
      precio: precioNum,
      imagenUrl: form.imagenUrl.trim() ? form.imagenUrl.trim() : null,
      idCategoria: form.idCategoria ? Number(form.idCategoria) : undefined,
      // NO enviar stock/talla/color: se sincronizan desde producto_variantes por triggers/SP
    };

    const url = editing
      ? `/api/admin/productos/${editing.id}`
      : `/api/admin/productos`;
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al guardar producto");
      return;
    }

    alert(editing ? "Producto actualizado." : "Producto creado.");
    setOpenModal(false);
    await fetchProductos();
  };

  /* ===== Eliminar ===== */
  const onDelete = async (p: Producto) => {
    if (!confirm(`Eliminar el producto "${p.nombre}"?`)) return;
    const res = await fetch(`/api/admin/productos/${p.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await fetchProductos();
    alert("Producto eliminado.");
  };

  /* ===== Exportar PDF (lista) ===== */
  const exportPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = items.map((p) => [
      p.id,
      p.nombre,
      p.categoria?.nombre ?? "—",
      typeof p.stock === "number" ? p.stock : p.stock ?? 0,
      `Q ${toNumber(p.precio).toFixed(2)}`,
    ]);
    doc.text("Productos - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nombre", "Categoría", "Stock", "Precio"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 70 },
        2: { cellWidth: 50 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
      },
    });
    doc.save("productos.pdf");
    alert("PDF de productos generado.");
  };

  /* ===== Exportar PDF individual ===== */
  const exportProductPDF = (p: Producto) => {
    const doc = new jsPDF();
    const rows: RowInput[] = [
      ["ID", String(p.id)],
      ["Nombre", p.nombre ?? "—"],
      ["Descripción", p.descripcion ?? "—"],
      ["Categoría", p.categoria?.nombre ?? "—"],
      ["Stock", String(typeof p.stock === "number" ? p.stock : p.stock ?? 0)],
      ["Precio", `Q ${toNumber(p.precio).toFixed(2)}`],
      ["Tallas", p.talla ?? "—"],
      ["Color", p.color ?? "—"],
      ["Imagen URL", p.imagenUrl ?? "—"],
    ];
    doc.text(`Producto #${p.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`producto_${p.id}.pdf`);
    alert(`PDF del producto #${p.id} generado.`);
  };

  /* ===== Paginación cliente ===== */
  const count = items.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, count);

  const pagedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      {/* Barra superior: filtros plegables y acciones */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
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
              onClick={exportPDF}
            >
              <PdfIcon />
            </button>
            <button className="btn btn--primary" onClick={openCreate}>
              Nuevo producto
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              className="input"
              placeholder="Buscar por nombre, descripción o color…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 240 }}
            />
            <select
              className="input"
              value={categoria}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCategoria(e.target.value)
              }
            >
              <option value="">Todas las categorías</option>
              {cats.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <span className="muted">Orden:</span>
            <select
              className="input"
              value={order}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setOrder(e.target.value as OrderField)
              }
              style={{ width: 120 }}
            >
              <option value="id">ID</option>
              <option value="nombre">Nombre</option>
              <option value="precio">Precio</option>
            </select>
            <select
              className="input"
              value={dir}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setDir(e.target.value as Dir)
              }
              style={{ width: 110 }}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>

            <button className="btn" onClick={fetchProductos} disabled={loading}>
              Filtrar
            </button>

            {/* Page size arriba */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="muted">Ver:</span>
              <select
                className="input"
                value={pageSize}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPageSize(Number(e.target.value))
                }
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
              <th>Producto</th>
              <th>Categoría</th>
              <th style={{ width: 80 }}>Stock</th>
              <th style={{ width: 110 }}>Precio</th>
              <th style={{ width: 140 }} />
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  <div className="font-medium">{p.nombre}</div>
                  <div className="muted text-sm">
                    {p.descripcion ? p.descripcion : "—"}
                  </div>
                </td>
                <td>{p.categoria?.nombre ?? "—"}</td>
                <td>{typeof p.stock === "number" ? p.stock : p.stock ?? 0}</td>
                <td>Q {toNumber(p.precio).toFixed(2)}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(p)}
                  >
                    <ViewIcon />
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
                    onClick={() => onDelete(p)}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pagedItems.length === 0 && (
              <tr>
                <td colSpan={6} className="muted text-center p-4">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación inferior */}
      <div className="panel p-3 mt-3 flex items-center justify-between gap-3">
        <div className="muted">
          Mostrando {count ? startIndex + 1 : 0}-{endIndex} de {count}
        </div>
        <div className="flex gap-2">
          <button
            className="btn"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            « Anterior
          </button>
        </div>
        <div className="muted">
          Página {pageSafe} / {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            className="btn"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
              width: "min(620px, 92%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de producto</h3>
              <div className="flex items-center gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportProductPDF(viewing)}
                >
                  <PdfIcon />
                </button>
                <button className="icon-btn" onClick={() => setViewing(null)}>
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <div>
                <b>ID:</b> {viewing.id}
              </div>
              <div>
                <b>Nombre:</b> {viewing.nombre}
              </div>
              <div>
                <b>Descripción:</b> {viewing.descripcion ?? "—"}
              </div>
              <div>
                <b>Categoría:</b> {viewing.categoria?.nombre ?? "—"}
              </div>
              <div>
                <b>Stock:</b>{" "}
                {typeof viewing.stock === "number"
                  ? viewing.stock
                  : viewing.stock ?? 0}
              </div>
              <div>
                <b>Precio:</b> Q {toNumber(viewing.precio).toFixed(2)}
              </div>
              <div>
                <b>Tallas:</b> {viewing.talla ?? "—"}
              </div>
              <div>
                <b>Color:</b> {viewing.color ?? "—"}
              </div>
              <div>
                <b>Imagen URL:</b>{" "}
                {viewing.imagenUrl ? (
                  <a
                    href={viewing.imagenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                  >
                    {viewing.imagenUrl}
                  </a>
                ) : (
                  "—"
                )}
              </div>
              {viewing.imagenUrl && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={viewing.imagenUrl}
                    alt={viewing.nombre}
                    style={{
                      maxWidth: "100px",
                      maxHeight: "100px",
                      borderRadius: 8,
                      objectFit: "cover",
                      display: "block",
                      marginTop: "8px",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer Crear/Editar */}
      {openModal && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Editar producto" : "Nuevo producto"}
          style={{ position: "fixed", inset: 0, zIndex: 1000 }}
          onClick={closeModal}
        >
          <div
            className="admin-right-drawer-backdrop"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,.45)",
              backdropFilter: "blur(1px)",
            }}
          />
          <div
            className="admin-right-drawer-panel"
            role="document"
            onClick={(e) => e.stopPropagation()}
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
              display: "grid",
              gridTemplateRows: "auto 1fr",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">
                {editing ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button className="btn" onClick={closeModal}>
                Cerrar
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3">
              <label className="grid gap-1">
                <span>Nombre</span>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="grid gap-1">
                <span>Descripción</span>
                <textarea
                  className="input"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descripcion: e.target.value }))
                  }
                  rows={3}
                />
              </label>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Precio (Q)</span>
                  <input
                    className="input"
                    inputMode="decimal"
                    pattern="^[0-9]+(\.[0-9]{1,2})?$"
                    placeholder="0.00"
                    value={form.precio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, precio: e.target.value }))
                    }
                    required
                    title="Solo números y hasta 2 decimales"
                  />
                </label>

                <label className="grid gap-1">
                  <span>Imagen URL</span>
                  <input
                    className="input"
                    type="url"
                    value={form.imagenUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, imagenUrl: e.target.value }))
                    }
                    placeholder="https://bucket.s3.amazonaws.com/imagen.jpg"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span>Categoría</span>
                <select
                  className="input"
                  value={form.idCategoria}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setForm((f) => ({ ...f, idCategoria: e.target.value }))
                  }
                >
                  <option value="">Sin categoría</option>
                  {cats.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>

              {/* Derivados + Shortcuts (solo al editar, para que al crear no confunda) */}
              {editing && (
                <div
                  className="grid gap-2 p-3 rounded-md"
                  style={{ background: "var(--soft)" }}
                >
                  <div className="muted text-sm">
                    Valores derivados (solo lectura):
                  </div>

                  <div
                    className="grid"
                    style={{ gridTemplateColumns: "130px 1fr" }}
                  >
                    <span className="muted">Stock total</span>
                    <span>
                      {typeof editing.stock === "number"
                        ? editing.stock
                        : editing.stock ?? 0}
                    </span>
                  </div>

                  <div
                    className="grid"
                    style={{ gridTemplateColumns: "130px 1fr" }}
                  >
                    <span className="muted">Tallas</span>
                    <span>{editing.talla ?? "—"}</span>
                  </div>

                  <div
                    className="grid"
                    style={{ gridTemplateColumns: "130px 1fr" }}
                  >
                    <span className="muted">Colores</span>
                    <span>{editing.color ?? "—"}</span>
                  </div>

                  <div className="flex gap-8 mt-2">
                    <a
                      className="link"
                      href={`/admin/variantes?producto=${editing.id}`}
                    >
                      Gestionar Variantes
                    </a>
                    <a
                      className="link"
                      href={`/admin/imagenes-productos?producto=${editing.id}`}
                    >
                      Imágenes
                    </a>
                    <a
                      className="link"
                      href={`/admin/clasificacion-abc?producto=${editing.id}`}
                    >
                      Clasificación ABC
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  {editing ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
