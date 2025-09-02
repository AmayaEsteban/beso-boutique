// src/app/admin/imagenes-productos/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ========== Icons (mismo set) ========== */
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

/* ========== Tipos ========== */
type Imagen = {
  id: number;
  idProducto: number;
  url: string;
  alt: string | null;
  orden: number;
};
type ProductoLite = { id: number; nombre: string };

type FormState = {
  id?: number;
  idProducto: string; // select
  url: string;
  alt: string;
  orden: string; // input → parse a int
};

type Dir = "asc" | "desc";

/* ========== Helpers ========== */
const toInt = (s: string) => {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};
const isHttpUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);

/* ========== Page ========== */
export default function ImagenesProductoPage() {
  const [rows, setRows] = useState<Imagen[]>([]);
  const [productos, setProductos] = useState<ProductoLite[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState(""); // buscar en url/alt
  const [productoSel, setProductoSel] = useState<string>("");
  const [dir, setDir] = useState<Dir>("asc"); // por orden asc/desc
  const [filtersOpen, setFiltersOpen] = useState(false);

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // modal detalle
  const [viewing, setViewing] = useState<Imagen | null>(null);

  // drawer crear/editar
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Imagen | null>(null);
  const [form, setForm] = useState<FormState>({
    idProducto: "",
    url: "",
    alt: "",
    orden: "0",
  });

  /* ---- Carga ---- */
  const loadProductos = async () => {
    try {
      let res = await fetch("/api/admin/productos?limit=500&fields=id,nombre");
      if (!res.ok) res = await fetch("/api/admin/productos?limit=500");
      const raw = (await res.json()) as unknown;
      const list: ProductoLite[] = Array.isArray(raw)
        ? raw
            .map((r) => {
              if (r && typeof r === "object") {
                const o = r as Record<string, unknown>;
                const id = Number(o.id);
                const nombre =
                  typeof o.nombre === "string" ? o.nombre : undefined;
                if (Number.isFinite(id) && nombre) return { id, nombre };
              }
              return null;
            })
            .filter((x): x is ProductoLite => x !== null)
        : [];
      setProductos(list);
    } catch {
      setProductos([]);
    }
  };

  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (productoSel) sp.set("idProducto", productoSel);
    const res = await fetch(`/api/admin/imagenes-productos?${sp.toString()}`);
    const data = (await res.json()) as Imagen[];
    // orden local (por `orden`, asc|desc)
    const sorted = [...data].sort((a, b) =>
      dir === "asc" ? a.orden - b.orden : b.orden - a.orden
    );
    setRows(sorted);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    void loadProductos();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- CRUD ---- */
  const openCreate = () => {
    setEditing(null);
    setForm({ idProducto: productoSel || "", url: "", alt: "", orden: "0" });
    setOpen(true);
  };

  const openEdit = (img: Imagen) => {
    setEditing(img);
    setForm({
      id: img.id,
      idProducto: String(img.idProducto),
      url: img.url,
      alt: img.alt ?? "",
      orden: String(img.orden),
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.idProducto) {
      alert("Selecciona un producto.");
      return;
    }
    if (!isHttpUrl(form.url)) {
      alert("URL inválida. Debe iniciar con http(s)://");
      return;
    }
    const payload = {
      idProducto: Number(form.idProducto),
      url: form.url.trim(),
      alt: form.alt.trim() ? form.alt.trim() : null,
      orden: Math.max(0, toInt(form.orden)),
    };

    const url = editing
      ? `/api/admin/imagenes-productos/${editing.id}`
      : `/api/admin/imagenes-productos`;
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al guardar imagen");
      return;
    }
    setOpen(false);
    await load();
    alert(editing ? "Imagen actualizada." : "Imagen creada.");
  };

  const onDelete = async (img: Imagen) => {
    if (!confirm(`Eliminar imagen #${img.id}?`)) return;
    const res = await fetch(`/api/admin/imagenes-productos/${img.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await load();
    alert("Imagen eliminada.");
  };

  /* ---- PDF ---- */
  const exportPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = filtered.map((r) => [
      r.id,
      r.idProducto,
      r.url,
      r.alt ?? "-",
      r.orden,
    ]);
    doc.text("Imágenes de productos - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Producto", "URL", "ALT", "Orden"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 2: { cellWidth: 90 } },
    });
    doc.save("imagenes_productos.pdf");
    alert("PDF de lista generado.");
  };

  const exportItemPDF = (img: Imagen) => {
    const doc = new jsPDF();
    const rows: RowInput[] = [
      ["ID", String(img.id)],
      ["ID Producto", String(img.idProducto)],
      ["URL", img.url],
      ["ALT", img.alt ?? "-"],
      ["Orden", String(img.orden)],
    ];
    doc.text(`Imagen #${img.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 130 } },
    });
    doc.save(`imagen_${img.id}.pdf`);
    alert(`PDF de la imagen #${img.id} generado.`);
  };

  /* ---- Filtro local por q ---- */
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.url.toLowerCase().includes(term) ||
        (r.alt ? r.alt.toLowerCase().includes(term) : false)
    );
  }, [rows, q]);

  /* ---- Paginación ---- */
  const count = filtered.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, count);
  const pageRows = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );
  useEffect(() => setPage(1), [pageSize]);

  /* ---- Render ---- */
  const prodName = (id: number) =>
    productos.find((p) => p.id === id)?.nombre ?? `#${id}`;

  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Imágenes de Productos</h1>

      {/* Barra superior */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
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
              onClick={exportPDF}
            >
              <PdfIcon />
            </button>
            <button className="btn primary" onClick={openCreate}>
              <PlusIcon style={{ marginRight: 8 }} />
              Nueva imagen
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              className="input"
              placeholder="Buscar por URL o ALT…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 240 }}
            />
            <select
              className="input"
              value={productoSel}
              onChange={(e) => setProductoSel(e.target.value)}
              style={{ minWidth: 220 }}
            >
              <option value="">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={dir}
              onChange={(e) => setDir(e.target.value as Dir)}
              title="Orden por campo 'orden'"
              style={{ width: 110 }}
            >
              <option value="asc">Orden ↑</option>
              <option value="desc">Orden ↓</option>
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
              <th>Producto</th>
              <th>Preview</th>
              <th>URL</th>
              <th>ALT</th>
              <th style={{ width: 90 }}>Orden</th>
              <th style={{ width: 150 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((img) => (
              <tr key={img.id}>
                <td>{img.id}</td>
                <td>{prodName(img.idProducto)}</td>
                <td>
                  <img
                    src={img.url}
                    alt={img.alt ?? ""}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                    onError={(e) => (e.currentTarget.src = "/no-image.png")}
                  />
                </td>
                <td className="truncate">{img.url}</td>
                <td>{img.alt ?? "-"}</td>
                <td>{img.orden}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(img)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(img)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => onDelete(img)}
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
          <div className="muted" style={{ padding: "6px 10px" }}>
            Página {pageSafe} / {totalPages}
          </div>
          <button
            className="btn"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente »
          </button>
        </div>
      </div>

      {/* Modal detalle */}
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
            style={{
              background: "var(--panel)",
              color: "var(--ink)",
              margin: "4% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(720px, 92%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de imagen</h3>
              <div className="flex items-center gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportItemPDF(viewing)}
                >
                  <PdfIcon />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setViewing(null)}
                  title="Cerrar"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
            <p>
              <b>ID:</b> {viewing.id}
            </p>
            <p>
              <b>Producto:</b> {prodName(viewing.idProducto)} (#
              {viewing.idProducto})
            </p>
            <p>
              <b>URL:</b>{" "}
              <a href={viewing.url} target="_blank" rel="noreferrer">
                {viewing.url}
              </a>
            </p>
            <p>
              <b>ALT:</b> {viewing.alt ?? "-"}
            </p>
            <p>
              <b>Orden:</b> {viewing.orden}
            </p>
            <div style={{ marginTop: 12 }}>
              <img
                src={viewing.url}
                alt={viewing.alt ?? ""}
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "contain",
                  borderRadius: 8,
                }}
                onError={(e) => (e.currentTarget.src = "/no-image.png")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drawer crear/editar */}
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
              display: "grid",
              gridTemplateRows: "auto 1fr",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">
                {editing ? "Editar imagen" : "Nueva imagen"}
              </h3>
              <button className="btn ghost" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>

            <form className="grid gap-3" onSubmit={onSubmit}>
              <label className="grid gap-1">
                <span>Producto</span>
                <select
                  className="input"
                  value={form.idProducto}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, idProducto: e.target.value }))
                  }
                  required
                >
                  <option value="">Seleccione…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span>URL</span>
                <input
                  className="input"
                  value={form.url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url: e.target.value }))
                  }
                  placeholder="https://…"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span>ALT (texto alternativo)</span>
                <input
                  className="input"
                  value={form.alt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, alt: e.target.value }))
                  }
                  placeholder="Descripción corta para SEO/accesibilidad"
                />
              </label>

              <label className="grid gap-1">
                <span>Orden (0 = más importante)</span>
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="^[0-9]+$"
                  value={form.orden}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      orden: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="0"
                  title="Entero no negativo"
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
                  {editing ? "Guardar cambios" : "Crear imagen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
