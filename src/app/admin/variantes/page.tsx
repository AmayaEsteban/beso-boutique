// src/app/admin/variantes/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ======================================
   Tipos estrictos (sin any)
====================================== */
type ProductoLite = { id: number; nombre: string };

type Color = {
  id: number;
  nombre: string;
  hex: string | null;
};

type Talla = {
  id: number;
  codigo: string;
  orden?: number;
};

type Variante = {
  id: number;
  idProducto: number;
  idColor: number | null;
  idTalla: number | null;
  sku: string | null;
  precio: number | null;
  stock: number;
  imagenUrl: string | null;

  // Incluidos cuando la API devuelve relaciones
  producto?: ProductoLite;
  color?: Color | null;
  talla?: Talla | null;
};

type VarianteCreate = {
  idProducto: number;
  idColor: number | null;
  idTalla: number | null;
  sku: string | null;
  precio: number | null;
  stock: number;
  imagenUrl: string | null;
};

type OrderField = "id" | "idProducto" | "sku";
type Dir = "asc" | "desc";

/* ======================================
   Iconos inline (mismos que en Productos)
====================================== */
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

/* ======================================
   Helpers de parseo/normalización
====================================== */
const toNumStrict = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
const toIntStrict = (v: unknown): number | null => {
  const n = toNumStrict(v);
  return n === null ? null : Math.trunc(n);
};
const normalizeVariante = (raw: unknown): Variante | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = toIntStrict(r.id);
  const idProducto = toIntStrict(r.idProducto);
  const idColor = r.idColor === null ? null : toIntStrict(r.idColor);
  const idTalla = r.idTalla === null ? null : toIntStrict(r.idTalla);
  const stock = toIntStrict(r.stock);
  const precio = r.precio === null ? null : toNumStrict(r.precio);
  if (id == null || idProducto == null || stock == null) return null;

  const v: Variante = {
    id,
    idProducto,
    idColor: idColor ?? null,
    idTalla: idTalla ?? null,
    sku: typeof r.sku === "string" && r.sku.trim() ? r.sku : null,
    precio,
    stock,
    imagenUrl:
      typeof r.imagenUrl === "string" && r.imagenUrl.trim()
        ? r.imagenUrl
        : null,
  };

  // Relaciones
  if (r.producto && typeof r.producto === "object") {
    const p = r.producto as Record<string, unknown>;
    const pid = toIntStrict(p.id);
    const pnombre =
      typeof p.nombre === "string" && p.nombre.trim() ? p.nombre : undefined;
    if (pid != null && pnombre) v.producto = { id: pid, nombre: pnombre };
  }
  if (r.color && typeof r.color === "object") {
    const c = r.color as Record<string, unknown>;
    const cid = toIntStrict(c.id);
    const cnombre =
      typeof c.nombre === "string" && c.nombre.trim() ? c.nombre : undefined;
    const chex =
      typeof c.hex === "string" ? c.hex : c.hex === null ? null : undefined;
    if (cid != null && cnombre)
      v.color = { id: cid, nombre: cnombre, hex: chex ?? null };
  }
  if (r.talla && typeof r.talla === "object") {
    const t = r.talla as Record<string, unknown>;
    const tid = toIntStrict(t.id);
    const tcodigo =
      typeof t.codigo === "string" && t.codigo.trim() ? t.codigo : undefined;
    if (tid != null && tcodigo) v.talla = { id: tid, codigo: tcodigo };
  }
  return v;
};

/* ======================================
   UI helpers
====================================== */
const colorLabel = (c?: Color | null) =>
  c ? (c.hex ? `${c.nombre} (${c.hex})` : c.nombre) : "-";
const to2 = (n: number) => n.toFixed(2);

/* ======================================
   Página
====================================== */
export default function VariantesPage() {
  // Estado base
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [productos, setProductos] = useState<ProductoLite[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros/listado
  const [q, setQ] = useState("");
  const [productoSel, setProductoSel] = useState<string>("");
  const [orden, setOrden] = useState<OrderField>("id");
  const [dir, setDir] = useState<Dir>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // detalle (ojito)
  const [viewing, setViewing] = useState<Variante | null>(null);

  // form crear/editar
  type FormState = {
    id?: number;
    idProducto: string;
    idColor: string;
    idTalla: string;
    sku: string;
    precio: string;
    stock: string;
    imagenUrl: string;
  };
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Variante | null>(null);
  const [form, setForm] = useState<FormState>({
    idProducto: "",
    idColor: "",
    idTalla: "",
    sku: "",
    precio: "",
    stock: "0",
    imagenUrl: "",
  });

  /* =============== Carga de datos =============== */
  const loadProductos = async () => {
    try {
      let res = await fetch("/api/admin/productos?limit=500&fields=id,nombre");
      if (!res.ok) res = await fetch("/api/admin/productos?limit=500");
      const raw: unknown = await res.json();
      const list: ProductoLite[] = Array.isArray(raw)
        ? raw
            .map((r) => {
              if (r && typeof r === "object") {
                const o = r as Record<string, unknown>;
                const id = toIntStrict(o.id);
                const nombre =
                  typeof o.nombre === "string" ? o.nombre : undefined;
                if (id != null && nombre) return { id, nombre };
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

  const loadColores = async () => {
    try {
      const res = await fetch("/api/admin/colores?limit=500");
      if (!res.ok) return;
      const raw: unknown = await res.json();
      const list: Color[] = Array.isArray(raw)
        ? raw
            .map((r) => {
              if (r && typeof r === "object") {
                const o = r as Record<string, unknown>;
                const id = toIntStrict(o.id);
                const nombre =
                  typeof o.nombre === "string" ? o.nombre : undefined;
                const hex =
                  typeof o.hex === "string"
                    ? o.hex
                    : o.hex === null
                    ? null
                    : undefined;
                if (id != null && nombre)
                  return { id, nombre, hex: hex ?? null };
              }
              return null;
            })
            .filter((x): x is Color => x !== null)
        : [];
      setColores(list);
    } catch {
      setColores([]);
    }
  };

  const loadTallas = async () => {
    try {
      const res = await fetch("/api/admin/tallas?limit=500");
      if (!res.ok) return;
      const raw: unknown = await res.json();
      const list: Talla[] = Array.isArray(raw)
        ? raw
            .map((r) => {
              if (r && typeof r === "object") {
                const o = r as Record<string, unknown>;
                const id = toIntStrict(o.id);
                const codigo =
                  typeof o.codigo === "string" ? o.codigo : undefined;
                if (id != null && codigo) return { id, codigo };
              }
              return null;
            })
            .filter((x): x is Talla => x !== null)
        : [];
      setTallas(list);
    } catch {
      setTallas([]);
    }
  };

  const loadVariantes = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (productoSel) sp.set("producto", productoSel);
      sp.set("order", orden);
      sp.set("dir", dir);

      const res = await fetch(`/api/admin/variantes?${sp.toString()}`);
      const raw: unknown = await res.json();

      const list: Variante[] = Array.isArray(raw)
        ? raw.map(normalizeVariante).filter((x): x is Variante => x !== null)
        : [];

      setVariantes(list);
      setPage(1);
    } catch {
      setVariantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProductos();
    void loadColores();
    void loadTallas();
    void loadVariantes();
  }, []);

  /* =============== Helpers UI =============== */
  const prodName = (idProducto: number) =>
    productos.find((p) => p.id === idProducto)?.nombre ?? `#${idProducto}`;

  const filtered = useMemo(() => variantes, [variantes]);

  // paginación
  const count = filtered.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(
    () => filtered.slice(start, end),
    [filtered, start, end]
  );

  /* =============== Exportar PDF =============== */
  const exportListPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = variantes.map((v) => [
      v.id,
      v.producto?.nombre ?? prodName(v.idProducto),
      colorLabel(v.color ?? null),
      v.talla?.codigo ?? "-",
      v.sku ?? "-",
      v.stock ?? 0,
      v.precio != null ? `Q ${to2(v.precio)}` : "-",
    ]);
    doc.text("Variantes - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Producto", "Color", "Talla", "SKU", "Stock", "Precio"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20 },
        4: { cellWidth: 28 },
        5: { cellWidth: 18 },
        6: { cellWidth: 28 },
      },
    });
    doc.save("variantes.pdf");
    alert("PDF de variantes generado.");
  };

  const exportDetailPDF = (v: Variante) => {
    const doc = new jsPDF();
    const rows: RowInput[] = [
      ["ID", String(v.id)],
      ["Producto", v.producto?.nombre ?? prodName(v.idProducto)],
      ["Color", colorLabel(v.color ?? null)],
      ["Talla", v.talla?.codigo ?? "-"],
      ["SKU", v.sku ?? "-"],
      ["Stock", String(v.stock ?? 0)],
      ["Precio", v.precio != null ? `Q ${to2(v.precio)}` : "-"],
      ["Imagen URL", v.imagenUrl ?? "-"],
    ];
    doc.text(`Variante #${v.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`variante_${v.id}.pdf`);
    alert(`PDF de la variante #${v.id} generado.`);
  };

  /* =============== Crear / Editar =============== */
  const openCreate = () => {
    setEditing(null);
    setForm({
      idProducto: "",
      idColor: "",
      idTalla: "",
      sku: "",
      precio: "",
      stock: "0",
      imagenUrl: "",
    });
    setOpen(true);
  };

  const openEdit = (v: Variante) => {
    setEditing(v);
    setForm({
      id: v.id,
      idProducto: String(v.idProducto),
      idColor: v.idColor != null ? String(v.idColor) : "",
      idTalla: v.idTalla != null ? String(v.idTalla) : "",
      sku: v.sku ?? "",
      precio: v.precio != null ? String(v.precio) : "",
      stock: String(v.stock ?? 0),
      imagenUrl: v.imagenUrl ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idProducto) {
      alert("Selecciona un producto.");
      return;
    }

    const payload: VarianteCreate = {
      idProducto: Number(form.idProducto),
      idColor: form.idColor ? Number(form.idColor) : null,
      idTalla: form.idTalla ? Number(form.idTalla) : null,
      sku: form.sku.trim() === "" ? null : form.sku.trim(),
      precio:
        form.precio.trim() === ""
          ? null
          : Number(Number(form.precio).toFixed(2)),
      stock:
        form.stock.trim() === ""
          ? 0
          : Math.max(0, Number.parseInt(form.stock, 10)),
      imagenUrl: form.imagenUrl.trim() === "" ? null : form.imagenUrl.trim(),
    };

    const url = editing
      ? `/api/admin/variantes/${editing.id}`
      : `/api/admin/variantes`;
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err?.error ?? "Error al guardar variante");
      return;
    }

    setOpen(false);
    await loadVariantes();
    alert(editing ? "Variante actualizada." : "Variante creada.");
  };

  const onDelete = async (v: Variante) => {
    if (!confirm(`Eliminar variante #${v.id}?`)) return;
    const res = await fetch(`/api/admin/variantes/${v.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await loadVariantes();
    alert("Variante eliminada.");
  };

  /* =============== Render =============== */
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Variantes</h1>

      {/* Barra superior */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="input"
              placeholder="Buscar por SKU…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 220 }}
            />

            <select
              className="input"
              value={productoSel}
              onChange={(e) => setProductoSel(e.target.value)}
            >
              <option value="">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <span className="muted">Orden:</span>
            <select
              className="input"
              value={orden}
              onChange={(e) => setOrden(e.target.value as OrderField)}
              style={{ width: 140 }}
            >
              <option value="id">ID</option>
              <option value="idProducto">Producto</option>
              <option value="sku">SKU</option>
            </select>
            <select
              className="input"
              value={dir}
              onChange={(e) => setDir(e.target.value as Dir)}
              style={{ width: 110 }}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>

            <button className="btn" onClick={loadVariantes} disabled={loading}>
              Filtrar
            </button>
          </div>

          {/* Export + Nueva */}
          <div className="flex items-center gap-2">
            <button
              className="icon-btn"
              title="Exportar PDF"
              aria-label="Exportar PDF"
              onClick={exportListPDF}
            >
              <PdfIcon />
            </button>
            <button className="btn primary" onClick={openCreate}>
              Nueva variante
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Producto</th>
              <th>Color</th>
              <th>Talla</th>
              <th>SKU</th>
              <th style={{ width: 90 }}>Stock</th>
              <th style={{ width: 110 }}>Precio</th>
              <th style={{ width: 140 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.producto?.nombre ?? prodName(v.idProducto)}</td>
                <td>{colorLabel(v.color ?? null)}</td>
                <td>{v.talla?.codigo ?? "-"}</td>
                <td>{v.sku ?? "-"}</td>
                <td>{v.stock ?? 0}</td>
                <td>{v.precio != null ? `Q ${to2(v.precio)}` : "-"}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(v)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(v)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => onDelete(v)}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="muted text-center p-4">
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
              width: "min(620px, 92%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de variante</h3>
              <div className="flex items-center gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportDetailPDF(viewing)}
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
                <b>Producto:</b>{" "}
                {viewing.producto?.nombre ?? prodName(viewing.idProducto)}
              </div>
              <div>
                <b>Color:</b> {colorLabel(viewing.color ?? null)}
              </div>
              <div>
                <b>Talla:</b> {viewing.talla?.codigo ?? "-"}
              </div>
              <div>
                <b>SKU:</b> {viewing.sku ?? "-"}
              </div>
              <div>
                <b>Stock:</b> {viewing.stock ?? 0}
              </div>
              <div>
                <b>Precio:</b>{" "}
                {viewing.precio != null ? `Q ${to2(viewing.precio)}` : "-"}
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
                  "-"
                )}
              </div>
              {viewing.imagenUrl && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={viewing.imagenUrl}
                    alt={
                      viewing.sku ??
                      viewing.producto?.nombre ??
                      `Variante ${viewing.id}`
                    }
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
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
              display: "grid",
              gridTemplateRows: "auto 1fr",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">
                {editing ? "Editar variante" : "Nueva variante"}
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

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Color</span>
                  <select
                    className="input"
                    value={form.idColor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idColor: e.target.value }))
                    }
                  >
                    <option value="">—</option>
                    {colores.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {colorLabel(c)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span>Talla</span>
                  <select
                    className="input"
                    value={form.idTalla}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idTalla: e.target.value }))
                    }
                  >
                    <option value="">—</option>
                    {tallas.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.codigo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1">
                <span>SKU</span>
                <input
                  className="input"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
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
                    title="Hasta 2 decimales"
                  />
                </label>

                <label className="grid gap-1">
                  <span>Stock</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    pattern="^[0-9]+$"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, stock: e.target.value }))
                    }
                    required
                    title="Entero no negativo"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span>Imagen URL</span>
                <input
                  className="input"
                  type="url"
                  value={form.imagenUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imagenUrl: e.target.value }))
                  }
                  placeholder="https://…"
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
                  {editing ? "Guardar cambios" : "Crear variante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
