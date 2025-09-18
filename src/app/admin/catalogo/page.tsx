// src/app/admin/catalogo/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* =========================
   Tipos estrictos
========================= */
type ProductoLite = { id: number; nombre: string };
type Categoria = { id: number; nombre: string };

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

type Item = {
  // Fila proveniente de productoVariante
  id: number;
  idProducto: number;
  idColor: number | null;
  idTalla: number | null;
  sku: string | null;
  precio: number | null;
  stock: number;
  imagenUrl: string | null;
  producto?: ProductoLite;
  color?: Color | null;
  talla?: Talla | null;
};

type OrderField = "id" | "idProducto" | "sku";
type Dir = "asc" | "desc";

/* =========================
   Iconos inline
========================= */
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

/* =========================
   Sanitización / validaciones (front)
========================= */
const safeTitle = (s: string, max = 120) =>
  s
    .normalize("NFC")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/[^\p{L}\p{N}\s\-]/gu, "")
    .slice(0, max)
    .trim();

const safeText = (s: string, max = 1000) =>
  s
    .normalize("NFC")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/[^\p{L}\p{N}\s.,;:()/_'"!?¡¿%#@\-]/gu, "")
    .slice(0, max)
    .trim();

// SKU sin espacios (se sanea en vivo)
const safeSKU = (s: string, max = 40) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, "")
    .slice(0, max);

const safeURL = (s: string, max = 255) => {
  const v = s.trim().slice(0, max);
  if (!v) return "";
  if (!/^https?:\/\/[^\s]+$/i.test(v)) return "";
  return v;
};

const isMoney = (s: string) => /^[0-9]+(\.[0-9]{1,2})?$/.test(s);

/* =========================
   Helpers UI
========================= */
const to2 = (n: number) => n.toFixed(2);
const colorLabel = (c?: Color | null) =>
  c ? (c.hex ? `${c.nombre} (${c.hex})` : c.nombre) : "-";

/* =========================
   Normalización desde API
========================= */
const toInt = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : null;
};
const toNum = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const normalizeItem = (r: unknown): Item | null => {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  const id = toInt(o.id);
  const idProducto = toInt(o.idProducto);
  const stock = toInt(o.stock);
  if (id == null || idProducto == null || stock == null) return null;

  const it: Item = {
    id,
    idProducto,
    idColor: o.idColor == null ? null : toInt(o.idColor),
    idTalla: o.idTalla == null ? null : toInt(o.idTalla),
    sku: typeof o.sku === "string" && o.sku.trim() ? o.sku : null,
    precio: o.precio == null ? null : toNum(o.precio),
    stock,
    imagenUrl:
      typeof o.imagenUrl === "string" && o.imagenUrl.trim()
        ? o.imagenUrl
        : null,
  };
  if (o.producto && typeof o.producto === "object") {
    const p = o.producto as Record<string, unknown>;
    const pid = toInt(p.id);
    const pnombre = typeof p.nombre === "string" ? p.nombre : null;
    if (pid != null && pnombre) it.producto = { id: pid, nombre: pnombre };
  }
  if (o.color && typeof o.color === "object") {
    const c = o.color as Record<string, unknown>;
    const cid = toInt(c.id);
    const cn = typeof c.nombre === "string" ? c.nombre : null;
    const hx = typeof c.hex === "string" ? c.hex : c.hex === null ? null : null;
    if (cid != null && cn) it.color = { id: cid, nombre: cn, hex: hx };
  }
  if (o.talla && typeof o.talla === "object") {
    const t = o.talla as Record<string, unknown>;
    const tid = toInt(t.id);
    const tc = typeof t.codigo === "string" ? t.codigo : null;
    if (tid != null && tc) it.talla = { id: tid, codigo: tc };
  }
  return it;
};

/* =========================
   Página
========================= */
export default function CatalogoPage() {
  // Estado base
  const [rows, setRows] = useState<Item[]>([]);
  const [productos, setProductos] = useState<ProductoLite[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros / orden / paginación
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [q, setQ] = useState("");
  const [productoSel, setProductoSel] = useState<string>("");
  const [orden, setOrden] = useState<OrderField>("id");
  const [dir, setDir] = useState<Dir>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Detalle
  const [viewing, setViewing] = useState<Item | null>(null);

  // Drawer “Agregar producto”
  const [open, setOpen] = useState(false);

  type FormProducto = {
    nombre: string;
    descripcion: string;
    idCategoria: string;
  };
  const [fp, setFp] = useState<FormProducto>({
    nombre: "",
    descripcion: "",
    idCategoria: "",
  });

  // ÚNICO precio + imagen (se guardan en ambas tablas)
  type SharedFields = { precio: string; imagenUrl: string };
  const [shared, setShared] = useState<SharedFields>({
    precio: "",
    imagenUrl: "",
  });

  type FormCred = { idColor: string; idTalla: string; sku: string };
  const [cred, setCred] = useState<FormCred>({
    idColor: "",
    idTalla: "",
    sku: "",
  });

  // Drawer “Agregar credencial” (variante solamente)
  const [openCred, setOpenCred] = useState(false);
  type CredOnlyForm = {
    idProducto: string;
    idColor: string;
    idTalla: string;
    sku: string;
    precio: string; // autocompleta
    imagenUrl: string; // autocompleta
  };
  const [credOnly, setCredOnly] = useState<CredOnlyForm>({
    idProducto: "",
    idColor: "",
    idTalla: "",
    sku: "",
    precio: "",
    imagenUrl: "",
  });

  /* ====== Cargas ====== */
  const loadProductosLite = async () => {
    try {
      let res = await fetch("/api/admin/productos?limit=500&fields=id,nombre");
      if (!res.ok) res = await fetch("/api/admin/productos?limit=500");
      const raw: unknown = await res.json();
      const list: ProductoLite[] = Array.isArray(raw)
        ? raw
            .map((r) => {
              if (r && typeof r === "object") {
                const o = r as Record<string, unknown>;
                const id = toInt(o.id);
                const nombre = typeof o.nombre === "string" ? o.nombre : null;
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
                const id = toInt(o.id);
                const nombre = typeof o.nombre === "string" ? o.nombre : null;
                const hex =
                  typeof o.hex === "string"
                    ? o.hex
                    : o.hex === null
                    ? null
                    : null;
                if (id != null && nombre) return { id, nombre, hex };
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
                const id = toInt(o.id);
                const codigo = typeof o.codigo === "string" ? o.codigo : null;
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
  const loadCategorias = async () => {
    try {
      const res = await fetch("/api/admin/categorias");
      if (!res.ok) return;
      const raw: unknown = await res.json();
      const list: Categoria[] = Array.isArray(raw)
        ? raw
            .map((r) => {
              if (r && typeof r === "object") {
                const o = r as Record<string, unknown>;
                const id = toInt(o.id);
                const nombre = typeof o.nombre === "string" ? o.nombre : null;
                if (id != null && nombre) return { id, nombre };
              }
              return null;
            })
            .filter((x): x is Categoria => x !== null)
        : [];
      setCategorias(list);
    } catch {
      setCategorias([]);
    }
  };
  const loadItems = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (productoSel) sp.set("idProducto", productoSel); // <— corregido
      sp.set("order", orden);
      sp.set("dir", dir);
      const res = await fetch(`/api/admin/variantes?${sp.toString()}`);
      const raw: unknown = await res.json();
      const list: Item[] = Array.isArray(raw)
        ? raw.map(normalizeItem).filter((v): v is Item => v !== null)
        : [];
      setRows(list);
      setPage(1);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProductosLite();
    void loadColores();
    void loadTallas();
    void loadCategorias();
    void loadItems();
  }, []);

  /* ====== Export PDF ====== */
  const exportListPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = rows.map((v) => [
      v.id,
      v.producto?.nombre ??
        productos.find((p) => p.id === v.idProducto)?.nombre ??
        `#${v.idProducto}`,
      colorLabel(v.color ?? null),
      v.talla?.codigo ?? "-",
      v.sku ?? "-",
      v.stock ?? 0,
      v.precio != null ? `Q ${to2(v.precio)}` : "-",
    ]);
    doc.text("Catálogo - BESO", 14, 14);
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
    doc.save("catalogo.pdf");
    alert("PDF generado.");
  };

  /* ====== Crear PRODUCTO + credencial inicial ====== */
  const openNuevoProducto = () => {
    setFp({ nombre: "", descripcion: "", idCategoria: "" });
    setShared({ precio: "", imagenUrl: "" });
    setCred({ idColor: "", idTalla: "", sku: "" });
    setOpen(true);
  };
  const closeDrawer = () => setOpen(false);

  const submitNuevoProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombre = safeTitle(fp.nombre);
    if (!nombre) return alert("Nombre inválido.");
    const descripcion = fp.descripcion ? safeText(fp.descripcion) : "";
    const idCategoria = fp.idCategoria ? Number(fp.idCategoria) : null;
    if (fp.idCategoria && !Number.isFinite(idCategoria))
      return alert("Categoría inválida.");

    const precioStr = shared.precio.trim();
    if (!precioStr || !isMoney(precioStr))
      return alert("Precio inválido (hasta 2 decimales).");
    const precio = Number(precioStr);

    const img = shared.imagenUrl ? safeURL(shared.imagenUrl) : "";
    if (shared.imagenUrl && !img) return alert("URL de imagen inválida.");

    const idColor = cred.idColor ? Number(cred.idColor) : null;
    if (cred.idColor && !Number.isFinite(idColor))
      return alert("Color inválido.");

    const idTalla = cred.idTalla ? Number(cred.idTalla) : null;
    if (cred.idTalla && !Number.isFinite(idTalla))
      return alert("Talla inválida.");

    const sku = cred.sku ? safeSKU(cred.sku) : "";
    if (!sku) return alert("SKU requerido (A-Z, 0-9, . _ -).");

    const payload = {
      producto: {
        nombre,
        descripcion: descripcion || null,
        idCategoria: idCategoria ?? undefined,
        imagenUrl: img || null,
        precio,
      },
      variante: {
        sku,
        precio,
        imagenUrl: img || null,
        idColor,
        idTalla,
        stock: 0,
      },
    };

    const res = await fetch("/api/admin/productos-variantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert(err?.error ?? "Error al crear.");
    }

    alert("Producto y credencial creados.");
    setOpen(false);
    await Promise.all([loadProductosLite(), loadItems()]);
  };

  /* ====== Drawer “Agregar credencial” ====== */
  const loadProductoBasics = async (id: string) => {
    if (!id) {
      setCredOnly((s) => ({ ...s, precio: "", imagenUrl: "" }));
      return;
    }
    const res = await fetch(`/api/admin/productos/${id}`);
    if (!res.ok) return;
    const p = (await res.json()) as {
      id: number;
      precio: number | null;
      imagenUrl: string | null;
    };
    setCredOnly((s) => ({
      ...s,
      precio: p?.precio != null ? String(p.precio) : "",
      imagenUrl: p?.imagenUrl ?? "",
    }));
  };

  /* ====== Paginación ====== */
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  /* ====== Render ====== */
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Catálogo</h1>

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
            <button
              className="btn"
              onClick={() => {
                setCredOnly({
                  idProducto: "",
                  idColor: "",
                  idTalla: "",
                  sku: "",
                  precio: "",
                  imagenUrl: "",
                });
                setOpenCred(true);
              }}
            >
              Agregar credencial
            </button>
            <button className="btn btn--primary" onClick={openNuevoProducto}>
              Agregar producto
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
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

            <button className="btn" onClick={loadItems} disabled={loading}>
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
              <th>Color</th>
              <th>Talla</th>
              <th>SKU</th>
              <th style={{ width: 90 }}>Stock</th>
              <th style={{ width: 110 }}>Precio</th>
              <th style={{ width: 160 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>
                  {v.producto?.nombre ??
                    productos.find((p) => p.id === v.idProducto)?.nombre ??
                    `#${v.idProducto}`}
                </td>
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
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={async () => {
                      if (!confirm(`Eliminar credencial #${v.id}?`)) return;
                      const res = await fetch(`/api/admin/variantes/${v.id}`, {
                        method: "DELETE",
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        return alert(err?.error ?? "Error al eliminar.");
                      }
                      await loadItems();
                      alert("Eliminado.");
                    }}
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
              <h3 className="font-bold">Detalle</h3>
              <button className="icon-btn" onClick={() => setViewing(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="grid gap-2">
              <div>
                <b>ID:</b> {viewing.id}
              </div>
              <div>
                <b>Producto:</b>{" "}
                {viewing.producto?.nombre ??
                  productos.find((p) => p.id === viewing.idProducto)?.nombre ??
                  `#${viewing.idProducto}`}
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
                      `Item ${viewing.id}`
                    }
                    style={{
                      maxWidth: "160px",
                      maxHeight: "160px",
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

      {/* Drawer: PRODUCTO + credencial inicial */}
      {open && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          onClick={closeDrawer}
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
              width: "min(820px, 95vw)",
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
              <h3 className="text-lg font-bold">Agregar producto</h3>
              <button className="btn ghost" onClick={closeDrawer}>
                Cerrar
              </button>
            </div>

            <form onSubmit={submitNuevoProducto} className="grid gap-4">
              {/* Sección Producto */}
              <div
                className="p-3 rounded-md"
                style={{ background: "var(--soft)" }}
              >
                <b className="block mb-2">Datos del producto</b>

                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <label className="grid gap-1">
                    <span>Nombre</span>
                    <input
                      className="input"
                      value={fp.nombre}
                      onChange={(e) =>
                        setFp((s) => ({ ...s, nombre: e.target.value }))
                      }
                      onBlur={(e) =>
                        setFp((s) => ({
                          ...s,
                          nombre: safeTitle(e.target.value),
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-1">
                    <span>Categoría</span>
                    <select
                      className="input"
                      value={fp.idCategoria}
                      onChange={(e) =>
                        setFp((s) => ({ ...s, idCategoria: e.target.value }))
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
                </div>

                <label className="grid gap-1 mt-3">
                  <span>Descripción</span>
                  <textarea
                    className="input"
                    rows={3}
                    value={fp.descripcion}
                    onChange={(e) =>
                      setFp((s) => ({ ...s, descripcion: e.target.value }))
                    }
                    onBlur={(e) =>
                      setFp((s) => ({
                        ...s,
                        descripcion: safeText(e.target.value),
                      }))
                    }
                  />
                </label>

                <div
                  className="grid gap-3 mt-3"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <label className="grid gap-1">
                    <span>Imagen (URL) — se usa en ficha y credencial</span>
                    <input
                      className="input"
                      type="url"
                      value={shared.imagenUrl}
                      onChange={(e) =>
                        setShared((s) => ({ ...s, imagenUrl: e.target.value }))
                      }
                      onBlur={(e) =>
                        setShared((s) => ({
                          ...s,
                          imagenUrl: e.target.value.trim(),
                        }))
                      }
                      placeholder="https://…"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span>Precio (Q) — se usa en ficha y credencial</span>
                    <input
                      className="input"
                      inputMode="decimal"
                      pattern="^[0-9]+(\.[0-9]{1,2})?$"
                      value={shared.precio}
                      onChange={(e) =>
                        setShared((s) => ({ ...s, precio: e.target.value }))
                      }
                      placeholder="0.00"
                      required
                      title="Hasta 2 decimales"
                    />
                  </label>
                </div>
              </div>

              {/* Sección Credencial (variante) */}
              <div
                className="p-3 rounded-md"
                style={{ background: "var(--soft)" }}
              >
                <b className="block mb-2">Credencial</b>

                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <label className="grid gap-1">
                    <span>Color</span>
                    <select
                      className="input"
                      value={cred.idColor}
                      onChange={(e) =>
                        setCred((s) => ({ ...s, idColor: e.target.value }))
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
                      value={cred.idTalla}
                      onChange={(e) =>
                        setCred((s) => ({ ...s, idTalla: e.target.value }))
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

                <div
                  className="grid gap-3 mt-3"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <label className="grid gap-1">
                    <span>SKU</span>
                    <input
                      className="input"
                      value={cred.sku}
                      onChange={(e) =>
                        setCred((s) => ({ ...s, sku: safeSKU(e.target.value) }))
                      }
                      placeholder="ABC-001-XS"
                      required
                    />
                  </label>
                  {/* Sin precio duplicado aquí: usamos el compartido */}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={closeDrawer}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: CREDENCIAL SOLA (autofill desde producto) */}
      {openCred && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenCred(false)}
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
              width: "min(560px, 92vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Agregar credencial</h3>
              <button className="btn ghost" onClick={() => setOpenCred(false)}>
                Cerrar
              </button>
            </div>

            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();

                const idProducto = Number(credOnly.idProducto);
                const idColor = credOnly.idColor
                  ? Number(credOnly.idColor)
                  : null;
                const idTalla = credOnly.idTalla
                  ? Number(credOnly.idTalla)
                  : null;
                const sku = credOnly.sku.trim().toUpperCase();
                if (!Number.isFinite(idProducto))
                  return alert("Selecciona un producto.");
                if (!sku) return alert("SKU requerido.");

                const payload = {
                  idProducto,
                  idColor,
                  idTalla,
                  sku,
                  precio: credOnly.precio.trim() || null,
                  imagenUrl: credOnly.imagenUrl.trim() || null,
                } as const;

                const res = await fetch("/api/admin/variantes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  return alert(err?.error ?? "Error al crear credencial.");
                }
                setOpenCred(false);
                await loadItems();
                alert("Credencial creada.");
              }}
            >
              <label className="grid gap-1">
                <span>Producto</span>
                <select
                  className="input"
                  value={credOnly.idProducto}
                  onChange={async (e) => {
                    const v = e.target.value;
                    setCredOnly((s) => ({ ...s, idProducto: v }));
                    await loadProductoBasics(v); // autocompleta precio/imagen
                  }}
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
                    value={credOnly.idColor}
                    onChange={(e) =>
                      setCredOnly((s) => ({ ...s, idColor: e.target.value }))
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
                    value={credOnly.idTalla}
                    onChange={(e) =>
                      setCredOnly((s) => ({ ...s, idTalla: e.target.value }))
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
                  value={credOnly.sku}
                  onChange={(e) =>
                    setCredOnly((s) => ({
                      ...s,
                      sku: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9._-]/g, ""),
                    }))
                  }
                  placeholder="ABC-001-XS"
                  required
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
                    value={credOnly.precio}
                    onChange={(e) =>
                      setCredOnly((s) => ({ ...s, precio: e.target.value }))
                    }
                    placeholder="(del producto)"
                    title="Hasta 2 decimales"
                  />
                </label>
                <label className="grid gap-1">
                  <span>Imagen (URL)</span>
                  <input
                    className="input"
                    type="url"
                    value={credOnly.imagenUrl}
                    onChange={(e) =>
                      setCredOnly((s) => ({ ...s, imagenUrl: e.target.value }))
                    }
                    placeholder="(del producto)"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpenCred(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
