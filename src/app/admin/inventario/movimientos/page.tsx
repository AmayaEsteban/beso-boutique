// src/app/admin/inventario/movimientos/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos (sin any) ===== */
type Dir = "asc" | "desc";
type OrderField = "fecha" | "id";
type MovTipo = "ingreso" | "egreso" | "ajuste";

type ProductoLite = { id: number; nombre: string };
type ColorLite = { id: number; nombre: string; hex: string | null };
type TallaLite = { id: number; codigo: string };

type VarianteLite = {
  id: number;
  sku: string | null;
  color?: ColorLite | null;
  talla?: TallaLite | null;
};

type Movimiento = {
  id: number;
  idProducto: number;
  idVariante: number | null;
  tipo: MovTipo;
  cantidad: number;
  referencia: string | null;
  nota: string | null;
  idUsuario: number | null;
  fecha: string; // ISO
  producto: ProductoLite;
  variante?: VarianteLite | null;
};

type FormCreate = {
  idProducto: string;
  idVariante: string; // "" ó id
  tipo: MovTipo;
  cantidad: string; // text -> number
  referencia: string;
  nota: string;
};

/* ===== Icons (consistencia) ===== */
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

/* ===== Helpers ===== */
const toInt = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : NaN;
};
const badgeClass = (t: MovTipo) =>
  `badge ${t === "ingreso" ? "ok" : t === "egreso" ? "warn" : ""}`;

export default function MovimientosPage() {
  /* datos */
  const [rows, setRows] = useState<Movimiento[]>([]);
  const [productos, setProductos] = useState<ProductoLite[]>([]);
  const [variantes, setVariantes] = useState<VarianteLite[]>([]);

  /* filtros */
  const [q, setQ] = useState("");
  const [prod, setProd] = useState<string>("");
  const [tipo, setTipo] = useState<"" | MovTipo>("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [orden, setOrden] = useState<OrderField>("fecha");
  const [dir, setDir] = useState<Dir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* paginación */
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  /* crear */
  const [openDrawer, setOpenDrawer] = useState(false);
  const [form, setForm] = useState<FormCreate>({
    idProducto: "",
    idVariante: "",
    tipo: "ingreso",
    cantidad: "",
    referencia: "",
    nota: "",
  });

  /* detalle */
  const [viewing, setViewing] = useState<Movimiento | null>(null);

  /* cargar productos */
  const loadProductos = async () => {
    const res = await fetch("/api/admin/productos?limit=500&fields=id,nombre");
    const data = (await res.json()) as Array<{ id: number; nombre: string }>;
    setProductos(data);
  };

  /* cargar variantes segun producto (para crear) */
  const loadVariantesByProducto = async (idProducto: string) => {
    if (!idProducto) {
      setVariantes([]);
      return;
    }
    const res = await fetch(
      `/api/admin/variantes?idProducto=${encodeURIComponent(idProducto)}`
    );
    const data = (await res.json()) as VarianteLite[];
    setVariantes(data);
  };

  /* fetch movimientos */
  const load = async () => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (prod) sp.set("producto", prod);
    if (tipo) sp.set("tipo", tipo);
    if (desde) sp.set("desde", desde);
    if (hasta) sp.set("hasta", hasta);
    sp.set("order", orden);
    sp.set("dir", dir);
    const res = await fetch(
      `/api/admin/inventario/movimientos?${sp.toString()}`
    );
    const data = (await res.json()) as Movimiento[];
    setRows(data);
    setPage(1);
  };

  useEffect(() => {
    void loadProductos();
    void load();
  }, []);

  /* paginación memorizada */
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  /* crear */
  const openCreate = () => {
    setForm({
      idProducto: "",
      idVariante: "",
      tipo: "ingreso",
      cantidad: "",
      referencia: "",
      nota: "",
    });
    setVariantes([]);
    setOpenDrawer(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const idProducto = toInt(form.idProducto);
    const idVariante = form.idVariante ? toInt(form.idVariante) : NaN;
    const cantidad = toInt(form.cantidad);

    if (!Number.isFinite(idProducto)) {
      alert("Selecciona un producto.");
      return;
    }
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      alert("Cantidad inválida.");
      return;
    }

    const payload = {
      idProducto,
      idVariante: Number.isFinite(idVariante) ? idVariante : null,
      tipo: form.tipo,
      cantidad,
      referencia: form.referencia.trim() || null,
      nota: form.nota.trim() || null,
    } as const;

    const res = await fetch("/api/admin/inventario/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res
        .json()
        .catch(() => ({} as { error?: string }))) as { error?: string };
      alert(err?.error ?? "Error al crear movimiento");
      return;
    }

    setOpenDrawer(false);
    await load();
    alert("Movimiento registrado.");
  };

  const onDelete = async (m: Movimiento) => {
    if (m.tipo === "ajuste") {
      alert("Los ajustes no pueden eliminarse.");
      return;
    }
    if (!confirm(`¿Eliminar movimiento #${m.id}?`)) return;
    const res = await fetch(`/api/admin/inventario/movimientos/${m.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = (await res
        .json()
        .catch(() => ({} as { error?: string }))) as { error?: string };
      alert(err?.error ?? "No se pudo eliminar");
      return;
    }
    await load();
    alert("Movimiento eliminado (stock revertido).");
  };

  /* export PDF listado */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Movimientos de Inventario - BESO", 14, 14);
    const body: RowInput[] = rows.map((m) => [
      m.id,
      new Date(m.fecha).toLocaleString(),
      m.producto?.nombre ?? `#${m.idProducto}`,
      m.variante?.sku ?? "-",
      m.tipo,
      m.cantidad,
      m.referencia ?? "-",
    ]);
    autoTable(doc, {
      startY: 20,
      head: [
        ["ID", "Fecha", "Producto", "Variante", "Tipo", "Cantidad", "Ref."],
      ],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("movimientos_inventario.pdf");
    alert("PDF generado.");
  };

  /* export PDF detalle */
  const exportOnePDF = (m: Movimiento) => {
    const doc = new jsPDF();
    doc.text(`Movimiento #${m.id}`, 14, 14);
    const rowsTable: RowInput[] = [
      ["ID", String(m.id)],
      ["Fecha", new Date(m.fecha).toLocaleString()],
      ["Producto", m.producto?.nombre ?? `#${m.idProducto}`],
      ["Variante", m.variante?.sku ?? "-"],
      ["Tipo", m.tipo],
      ["Cantidad", String(m.cantidad)],
      ["Referencia", m.referencia ?? "-"],
      ["Nota", m.nota ?? "-"],
      ["Usuario", m.idUsuario != null ? String(m.idUsuario) : "-"],
    ];
    autoTable(doc, {
      startY: 22,
      head: [["Campo", "Valor"]],
      body: rowsTable,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
      theme: "grid",
    });
    doc.save(`mov_${m.id}.pdf`);
    alert("PDF del movimiento generado.");
  };

  return (
    <section className="w-full">
      {/* >>> TÍTULO DEL MÓDULO <<< */}
      <h1 className="text-2xl font-bold mb-4">Movimientos de Inventario</h1>

      {/* Barra superior compacta + botón Mostrar filtros */}
      <div className="panel p-4 mb-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="muted">Total: {count}</div>

          {/* Paginación compacta en cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            <span className="muted">
              {count === 0 ? 0 : start + 1}-{end} de {count}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn ghost"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
            <button
              className="icon-btn"
              onClick={exportPDF}
              title="Exportar PDF"
            >
              <PdfIcon />
            </button>
            <button className="btn primary" onClick={openCreate}>
              <PlusIcon style={{ marginRight: 8 }} />
              Nuevo movimiento
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div
            style={{
              display: "flex",
              gap: ".5rem",
              flexWrap: "wrap",
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <input
              className="input"
              placeholder="Buscar por referencia / nota / producto…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <select
              className="input"
              value={prod}
              onChange={(e) => setProd(e.target.value)}
            >
              <option value="">Producto (todos)</option>
              {productos.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "" | MovTipo)}
            >
              <option value="">Tipo (todos)</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
              <option value="ajuste">Ajuste</option>
            </select>
            <input
              className="input"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              title="Desde"
            />
            <input
              className="input"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              title="Hasta"
            />
            <span className="muted">Orden:</span>
            <select
              className="input"
              value={orden}
              onChange={(e) => setOrden(e.target.value as OrderField)}
              style={{ width: 140 }}
            >
              <option value="fecha">Fecha</option>
              <option value="id">ID</option>
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

            <button className="btn" onClick={load} disabled={false}>
              Filtrar
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Variante</th>
              <th>Tipo</th>
              <th style={{ width: 90 }}>Cantidad</th>
              <th>Referencia</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{new Date(m.fecha).toLocaleString()}</td>
                <td>{m.producto?.nombre ?? `#${m.idProducto}`}</td>
                <td>{m.variante?.sku ?? "-"}</td>
                <td>
                  <span className={badgeClass(m.tipo)}>{m.tipo}</span>
                </td>
                <td>{m.cantidad}</td>
                <td>{m.referencia ?? "-"}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver detalle"
                    onClick={() => setViewing(m)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className={`icon-btn danger ${
                      m.tipo === "ajuste" ? "disabled" : ""
                    }`}
                    title={
                      m.tipo === "ajuste"
                        ? "No es posible eliminar ajustes"
                        : "Eliminar"
                    }
                    onClick={() => onDelete(m)}
                    disabled={m.tipo === "ajuste"}
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

      {/* Paginación inferior */}
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
              margin: "5% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(520px, 92%)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de movimiento</h3>
              <div className="flex gap-2">
                <button
                  className="icon-btn"
                  onClick={() => exportOnePDF(viewing)}
                  title="Exportar PDF"
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
              <b>Fecha:</b> {new Date(viewing.fecha).toLocaleString()}
            </p>
            <p>
              <b>Producto:</b>{" "}
              {viewing.producto?.nombre ?? `#${viewing.idProducto}`}
            </p>
            <p>
              <b>Variante:</b> {viewing.variante?.sku ?? "-"}
            </p>
            <p>
              <b>Tipo:</b> {viewing.tipo}
            </p>
            <p>
              <b>Cantidad:</b> {viewing.cantidad}
            </p>
            <p>
              <b>Referencia:</b> {viewing.referencia ?? "-"}
            </p>
            <p>
              <b>Nota:</b> {viewing.nota ?? "-"}
            </p>
            <p>
              <b>Usuario:</b> {viewing.idUsuario ?? "-"}
            </p>
          </div>
        </div>
      )}

      {/* Drawer crear */}
      {openDrawer && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenDrawer(false)}
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
              display: "grid",
              gridTemplateRows: "auto 1fr",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Nuevo movimiento</h3>
              <button
                className="icon-btn"
                onClick={() => setOpenDrawer(false)}
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={submitCreate} className="grid gap-3">
              <label className="grid gap-1">
                <span>Producto</span>
                <select
                  className="input"
                  value={form.idProducto}
                  onChange={async (e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, idProducto: v, idVariante: "" }));
                    await loadVariantesByProducto(v);
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

              <label className="grid gap-1">
                <span>Variante (opcional)</span>
                <select
                  className="input"
                  value={form.idVariante}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, idVariante: e.target.value }))
                  }
                >
                  <option value="">— Sin variante —</option>
                  {variantes.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.sku ?? `#${v.id}`}{" "}
                      {v.color ? `• ${v.color.nombre}` : ""}{" "}
                      {v.talla ? `• ${v.talla.codigo}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Tipo</span>
                  <select
                    className="input"
                    value={form.tipo}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tipo: e.target.value as MovTipo,
                      }))
                    }
                    required
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                    <option value="ajuste">Ajuste (fija stock)</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span>Cantidad</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    pattern="^[0-9]+$"
                    placeholder="0"
                    value={form.cantidad}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cantidad: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span>Referencia (opcional)</span>
                <input
                  className="input"
                  value={form.referencia}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, referencia: e.target.value }))
                  }
                  placeholder="Factura, guía, etc."
                />
              </label>

              <label className="grid gap-1">
                <span>Nota (opcional)</span>
                <input
                  className="input"
                  value={form.nota}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nota: e.target.value }))
                  }
                  placeholder="Detalle libre"
                />
              </label>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpenDrawer(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
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
