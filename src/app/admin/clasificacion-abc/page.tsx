// src/app/admin/clasificacion-abc/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos estrictos ===== */
type ProductoLite = { id: number; nombre: string };

type ABCTipo = "A" | "B" | "C";

type ABCItem = {
  id: number;
  idProducto: number;
  tipo: ABCTipo;
  producto?: { nombre: string };
};

type FormState = {
  id?: number;
  idProducto: string; // select
  tipo: ABCTipo;
};

type OrderField = "id" | "idProducto" | "tipo";
type Dir = "asc" | "desc";

/* ===== Iconos (mismos del resto) ===== */
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

/* ===== Helpers de parseo ===== */
const toInt = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
};

const normalizeProducto = (r: unknown): ProductoLite | null => {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  const id = toInt(o.id);
  const nombre = typeof o.nombre === "string" ? o.nombre : undefined;
  return id != null && nombre ? { id, nombre } : null;
};

const normalizeABC = (r: unknown): ABCItem | null => {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  const id = toInt(o.id);
  const idProducto = toInt(o.idProducto);
  const tipo = o.tipo;
  if (id == null || idProducto == null) return null;
  if (tipo !== "A" && tipo !== "B" && tipo !== "C") return null;

  const item: ABCItem = { id, idProducto, tipo };
  if (o.producto && typeof o.producto === "object") {
    const p = o.producto as Record<string, unknown>;
    const nombre = typeof p.nombre === "string" ? p.nombre : undefined;
    if (nombre) item.producto = { nombre };
  }
  return item;
};

/* ===== Página ===== */
export default function ClasificacionABCPage() {
  const [rows, setRows] = useState<ABCItem[]>([]);
  const [productos, setProductos] = useState<ProductoLite[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros UI (client-side)
  const [productoSel, setProductoSel] = useState<string>("");
  const [tipoSel, setTipoSel] = useState<"" | ABCTipo>("");
  const [orden, setOrden] = useState<OrderField>("id");
  const [dir, setDir] = useState<Dir>("desc");

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // crear/editar
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ABCItem | null>(null);
  const [form, setForm] = useState<FormState>({ idProducto: "", tipo: "A" });

  // modal ver
  const [viewing, setViewing] = useState<ABCItem | null>(null);

  /* Carga */
  const loadProductos = async () => {
    try {
      let res = await fetch("/api/admin/productos?limit=500&fields=id,nombre");
      if (!res.ok) res = await fetch("/api/admin/productos?limit=500");
      const raw: unknown = await res.json();
      const list = Array.isArray(raw)
        ? raw
            .map(normalizeProducto)
            .filter((x): x is ProductoLite => x !== null)
        : [];
      setProductos(list);
    } catch {
      setProductos([]);
    }
  };

  const loadABC = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clasificacion-abc");
      const raw: unknown = await res.json();
      const list = Array.isArray(raw)
        ? raw.map(normalizeABC).filter((x): x is ABCItem => x !== null)
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
    void loadProductos();
    void loadABC();
  }, []);

  /* Helpers UI */
  const prodName = (idProducto: number) =>
    productos.find((p) => p.id === idProducto)?.nombre ?? `#${idProducto}`;

  const filteredSorted = useMemo(() => {
    let data = rows.slice();

    if (productoSel) {
      const pid = Number(productoSel);
      data = data.filter((r) => r.idProducto === pid);
    }
    if (tipoSel) {
      data = data.filter((r) => r.tipo === tipoSel);
    }

    data.sort((a, b) => {
      let cmp = 0;
      if (orden === "id") cmp = a.id - b.id;
      else if (orden === "idProducto") cmp = a.idProducto - b.idProducto;
      else if (orden === "tipo") cmp = a.tipo.localeCompare(b.tipo);
      return dir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [rows, productoSel, tipoSel, orden, dir]);

  // paginación
  const count = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(
    () => filteredSorted.slice(start, end),
    [filteredSorted, start, end]
  );

  /* Crear / Editar */
  const openCreate = () => {
    setEditing(null);
    setForm({ idProducto: "", tipo: "A" });
    setOpen(true);
  };

  const openEdit = (x: ABCItem) => {
    setEditing(x);
    setForm({ id: x.id, idProducto: String(x.idProducto), tipo: x.tipo });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idProducto || !["A", "B", "C"].includes(form.tipo)) {
      alert("Completa producto y tipo (A/B/C).");
      return;
    }

    const payload = {
      idProducto: Number(form.idProducto),
      tipo: form.tipo,
    };

    const url = editing
      ? `/api/admin/clasificacion-abc/${editing.id}`
      : `/api/admin/clasificacion-abc`;
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al guardar");
      return;
    }

    setOpen(false);
    await loadABC();
    alert(editing ? "Clasificación actualizada." : "Clasificación creada.");
  };

  const onDelete = async (x: ABCItem) => {
    if (
      !confirm(
        `Eliminar clasificación #${x.id} para ${prodName(x.idProducto)}?`
      )
    )
      return;
    const res = await fetch(`/api/admin/clasificacion-abc/${x.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await loadABC();
    alert("Clasificación eliminada.");
  };

  /* PDF: lista */
  const exportPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = filteredSorted.map((x) => [
      x.id,
      prodName(x.idProducto),
      x.tipo,
    ]);
    doc.text("Clasificación ABC - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Producto", "Tipo"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 120 },
        2: { cellWidth: 20 },
      },
    });
    doc.save("clasificacion_abc.pdf");
    alert("PDF de lista generado.");
  };

  /* PDF: detalle */
  const exportItemPDF = (x: ABCItem) => {
    const doc = new jsPDF();
    const rows: RowInput[] = [
      ["ID", String(x.id)],
      ["Producto", prodName(x.idProducto)],
      ["Tipo", x.tipo],
    ];
    doc.text(`Clasificación ABC #${x.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`clasificacion_abc_${x.id}.pdf`);
    alert(`PDF del registro #${x.id} generado.`);
  };

  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Clasificación ABC</h1>

      {/* Barra superior */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input"
            value={productoSel}
            onChange={(e) => setProductoSel(e.target.value)}
            title="Filtrar por producto"
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
            value={tipoSel}
            onChange={(e) => setTipoSel(e.target.value as "" | ABCTipo)}
            title="Filtrar por tipo"
            style={{ width: 140 }}
          >
            <option value="">Tipo (A/B/C)</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          <span className="muted">Orden:</span>
          <select
            className="input"
            value={orden}
            onChange={(e) => setOrden(e.target.value as OrderField)}
            style={{ width: 150 }}
          >
            <option value="id">ID</option>
            <option value="idProducto">Producto</option>
            <option value="tipo">Tipo</option>
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

          <button className="btn" onClick={loadABC} disabled={loading}>
            Refrescar
          </button>

          <div className="muted ml-auto">Total: {count}</div>

          <button className="icon-btn" onClick={exportPDF} title="Exportar PDF">
            <PdfIcon />
          </button>
          <button className="btn primary" onClick={openCreate}>
            <PlusIcon style={{ marginRight: 8 }} /> Nuevo registro
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Producto</th>
              <th style={{ width: 80 }}>Tipo</th>
              <th style={{ width: 140 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((x) => (
              <tr key={x.id}>
                <td>{x.id}</td>
                <td>{x.producto?.nombre ?? prodName(x.idProducto)}</td>
                <td>
                  <span className={`badge ${x.tipo === "A" ? "ok" : ""}`}>
                    {x.tipo}
                  </span>
                </td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    onClick={() => setViewing(x)}
                    title="Ver"
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => openEdit(x)}
                    title="Editar"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => onDelete(x)}
                    title="Eliminar"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="muted text-center p-4">
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
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--panel)",
              color: "var(--ink)",
              margin: "5% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(520px, 92%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle clasificación</h3>
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
              <b>Producto:</b>{" "}
              {viewing.producto?.nombre ?? prodName(viewing.idProducto)}
            </p>
            <p>
              <b>Tipo:</b> {viewing.tipo}
            </p>
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
              width: "min(520px, 92vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
              display: "grid",
              gridTemplateRows: "auto 1fr",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">
                {editing ? "Editar clasificación" : "Nueva clasificación"}
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
                <span>Tipo</span>
                <select
                  className="input"
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value as ABCTipo }))
                  }
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
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
                  {editing ? "Guardar cambios" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
