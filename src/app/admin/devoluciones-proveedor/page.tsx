"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos ===== */
type Dir = "asc" | "desc";
type Estado = "borrador" | "emitida" | "recibida" | "cancelada";
type Devolucion = {
  id: number;
  idProveedor: number;
  fecha: string; // ISO
  estado: Estado;
  nota: string | null;
  proveedor?: { nombre: string } | null;
  _count?: { items: number };
};
type DevItemLite = {
  id: number;
  idProducto: number;
  idVariante: number | null;
  cantidad: number;
  motivo: string | null;
  producto: { nombre: string };
  variante: {
    sku: string | null;
    color: string | null;
    talla: string | null;
  } | null;
};
type DevolucionFull = Devolucion & {
  items: DevItemLite[];
};

type OrderField = "fecha" | "id";
type Filtros = {
  proveedor: string;
  estado: "" | Estado;
  desde: string;
  hasta: string;
  order: OrderField;
  dir: Dir;
};

/* ===== Icons ===== */
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
const to2 = (n: number) => n.toFixed(2);
const badgeClass = (e: Estado) =>
  `badge ${
    e === "borrador"
      ? "warn"
      : e === "emitida"
      ? ""
      : e === "recibida"
      ? "ok"
      : "danger"
  }`;

type ProductoLite = { id: number; nombre: string };
type VarianteLite = {
  id: number;
  sku: string | null;
  color?: { nombre: string } | null;
  talla?: { codigo: string } | null;
};

/* ===== Página ===== */
export default function DevolucionesProveedorPage() {
  const [rows, setRows] = useState<Devolucion[]>([]);
  const [filters, setFilters] = useState<Filtros>({
    proveedor: "",
    estado: "",
    desde: "",
    hasta: "",
    order: "fecha",
    dir: "desc",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  const [viewing, setViewing] = useState<DevolucionFull | null>(null);

  // Crear
  const [openDrawer, setOpenDrawer] = useState(false);
  const [proveedorId, setProveedorId] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [nota, setNota] = useState<string>("");

  const [productos, setProductos] = useState<ProductoLite[]>([]);
  const [variantes, setVariantes] = useState<VarianteLite[]>([]);
  type NewItem = {
    idProducto: string;
    idVariante: string;
    cantidad: string;
    motivo: string;
  };
  const [items, setItems] = useState<NewItem[]>([]);

  /* cargar data */
  const load = async () => {
    const sp = new URLSearchParams();
    if (filters.proveedor) sp.set("proveedor", filters.proveedor);
    if (filters.estado) sp.set("estado", filters.estado);
    if (filters.desde) sp.set("desde", filters.desde);
    if (filters.hasta) sp.set("hasta", filters.hasta);
    sp.set("order", filters.order);
    sp.set("dir", filters.dir);

    const res = await fetch(
      `/api/admin/devoluciones-proveedor?${sp.toString()}`
    );
    const data = (await res.json()) as Devolucion[];
    setRows(data);
    setPage(1);
  };

  const loadProductos = async () => {
    const res = await fetch("/api/admin/productos?limit=500&fields=id,nombre");
    const data = (await res.json()) as Array<{ id: number; nombre: string }>;
    setProductos(data);
  };

  const loadVariantesByProducto = async (pid: string) => {
    if (!pid) {
      setVariantes([]);
      return;
    }
    const res = await fetch(
      `/api/admin/variantes?idProducto=${encodeURIComponent(pid)}`
    );
    const data = (await res.json()) as VarianteLite[];
    setVariantes(data);
  };

  useEffect(() => {
    void load();
    void loadProductos();
  }, []);

  /* abrir detalle */
  const openView = async (id: number) => {
    const res = await fetch(`/api/admin/devoluciones-proveedor/${id}`);
    const data = (await res.json()) as DevolucionFull;
    setViewing(data);
  };

  /* export listado */
  const exportListPDF = () => {
    const doc = new jsPDF();
    doc.text("Devoluciones a Proveedor - BESO", 14, 14);
    const body: RowInput[] = rows.map((d) => [
      d.id,
      new Date(d.fecha).toLocaleString(),
      d.proveedor?.nombre ?? `#${d.idProveedor}`,
      d.estado,
      d._count?.items ?? 0,
      d.nota ?? "-",
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Fecha", "Proveedor", "Estado", "Items", "Nota"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("devoluciones_proveedor.pdf");
    alert("PDF generado.");
  };

  /* crear item row */
  const addItemRow = () =>
    setItems((it) => [
      ...it,
      { idProducto: "", idVariante: "", cantidad: "", motivo: "" },
    ]);
  const removeItemRow = (idx: number) =>
    setItems((it) => it.filter((_, i) => i !== idx));

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const idProveedor = Number(proveedorId);
    if (!Number.isFinite(idProveedor) || idProveedor <= 0) {
      alert("Proveedor inválido");
      return;
    }
    if (items.length === 0) {
      alert("Agrega al menos un ítem");
      return;
    }

    const payload = {
      idProveedor,
      fecha: fecha || null,
      nota: nota.trim() || null,
      items: items.map((it) => ({
        idProducto: Number(it.idProducto),
        idVariante: it.idVariante ? Number(it.idVariante) : null,
        cantidad: Number(it.cantidad),
        motivo: it.motivo.trim() || null,
      })),
    } as const;

    // Validaciones rápidas cliente
    for (const it of payload.items) {
      if (!Number.isFinite(it.idProducto) || it.idProducto <= 0) {
        alert("Producto inválido en un ítem");
        return;
      }
      if (!Number.isFinite(it.cantidad) || it.cantidad <= 0) {
        alert("Cantidad inválida en un ítem");
        return;
      }
      if (it.idVariante != null && !Number.isFinite(it.idVariante)) {
        alert("Variante inválida en un ítem");
        return;
      }
    }

    const res = await fetch("/api/admin/devoluciones-proveedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al crear devolución");
      return;
    }

    setOpenDrawer(false);
    setProveedorId("");
    setFecha("");
    setNota("");
    setItems([]);
    await load();
    alert("Devolución creada (estado: borrador).");
  };

  const changeEstado = async (dev: DevolucionFull, estado: Estado) => {
    const res = await fetch(`/api/admin/devoluciones-proveedor/${dev.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo cambiar el estado");
      return;
    }
    await openView(dev.id);
    await load();
    alert(`Estado actualizado a ${estado}.`);
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Devoluciones a Proveedor</h1>

      {/* Barra superior compacta */}
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
              onClick={exportListPDF}
              title="Exportar PDF"
            >
              <PdfIcon />
            </button>
            <button
              className="btn primary"
              onClick={() => {
                setOpenDrawer(true);
                setItems([]);
              }}
            >
              <PlusIcon style={{ marginRight: 8 }} />
              Nueva devolución
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
              placeholder="ID Proveedor…"
              value={filters.proveedor}
              onChange={(e) =>
                setFilters((f) => ({ ...f, proveedor: e.target.value }))
              }
              style={{ width: 160 }}
            />
            <select
              className="input"
              value={filters.estado}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  estado: e.target.value as Filtros["estado"],
                }))
              }
            >
              <option value="">Estado (todos)</option>
              <option value="borrador">Borrador</option>
              <option value="emitida">Emitida</option>
              <option value="recibida">Recibida</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <input
              className="input"
              type="date"
              value={filters.desde}
              onChange={(e) =>
                setFilters((f) => ({ ...f, desde: e.target.value }))
              }
              title="Desde"
            />
            <input
              className="input"
              type="date"
              value={filters.hasta}
              onChange={(e) =>
                setFilters((f) => ({ ...f, hasta: e.target.value }))
              }
              title="Hasta"
            />
            <span className="muted">Orden:</span>
            <select
              className="input"
              value={filters.order}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  order: e.target.value as OrderField,
                }))
              }
              style={{ width: 140 }}
            >
              <option value="fecha">Fecha</option>
              <option value="id">ID</option>
            </select>
            <select
              className="input"
              value={filters.dir}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dir: e.target.value as Dir }))
              }
              style={{ width: 110 }}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button className="btn" onClick={load}>
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
              <th>Proveedor</th>
              <th>Estado</th>
              <th>Items</th>
              <th>Nota</th>
              <th style={{ width: 90 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{new Date(d.fecha).toLocaleString()}</td>
                <td>{d.proveedor?.nombre ?? `#${d.idProveedor}`}</td>
                <td>
                  <span className={badgeClass(d.estado)}>{d.estado}</span>
                </td>
                <td>{d._count?.items ?? 0}</td>
                <td>{d.nota ?? "-"}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver detalle"
                    onClick={() => void openView(d.id)}
                  >
                    <ViewIcon />
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

      {/* Modal detalle con acciones de estado */}
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
              margin: "4% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(820px, 96%)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de devolución</h3>
              <button
                className="icon-btn"
                onClick={() => setViewing(null)}
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mb-2">
              <p>
                <b>ID:</b> {viewing.id}
              </p>
              <p>
                <b>Fecha:</b> {new Date(viewing.fecha).toLocaleString()}
              </p>
              <p>
                <b>Proveedor:</b>{" "}
                {viewing.proveedor?.nombre ?? `#${viewing.idProveedor}`}
              </p>
              <p>
                <b>Estado:</b>{" "}
                <span className={badgeClass(viewing.estado)}>
                  {viewing.estado}
                </span>
              </p>
              <p>
                <b>Nota:</b> {viewing.nota ?? "-"}
              </p>
            </div>

            <div className="mb-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Variante</th>
                    <th style={{ width: 90 }}>Cant.</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {viewing.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.producto.nombre}</td>
                      <td>
                        {it.variante
                          ? `${it.variante.sku ?? ""} ${
                              it.variante.color ? `• ${it.variante.color}` : ""
                            } ${
                              it.variante.talla ? `• ${it.variante.talla}` : ""
                            }`
                          : "—"}
                      </td>
                      <td>{it.cantidad}</td>
                      <td>{it.motivo ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="btn"
                onClick={() => void changeEstado(viewing, "emitida")}
                disabled={viewing.estado !== "borrador"}
              >
                Emitir
              </button>
              <button
                className="btn"
                onClick={() => void changeEstado(viewing, "recibida")}
                disabled={
                  !(
                    viewing.estado === "emitida" ||
                    viewing.estado === "borrador"
                  )
                }
              >
                Marcar recibida
              </button>
              <button
                className="btn danger"
                onClick={() => void changeEstado(viewing, "cancelada")}
                disabled={viewing.estado === "cancelada"}
              >
                Cancelar
              </button>
            </div>
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
              width: "min(620px, 92vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
              display: "grid",
              gridTemplateRows: "auto 1fr",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Nueva devolución</h3>
              <button
                className="icon-btn"
                onClick={() => setOpenDrawer(false)}
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <form className="grid gap-3" onSubmit={submitCreate}>
              <label className="grid gap-1">
                <span>ID Proveedor</span>
                <input
                  className="input"
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  placeholder="Ej. 1"
                  required
                />
              </label>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Fecha (opcional)</span>
                  <input
                    className="input"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </label>
                <label className="grid gap-1">
                  <span>Nota (opcional)</span>
                  <input
                    className="input"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Comentario interno"
                  />
                </label>
              </div>

              <div className="panel p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">Ítems a devolver</h4>
                  <button type="button" className="btn" onClick={addItemRow}>
                    + Agregar ítem
                  </button>
                </div>

                {items.length === 0 && (
                  <div className="muted">Sin ítems (agrega al menos uno)</div>
                )}

                <div className="grid" style={{ gap: 8 }}>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid"
                      style={{
                        gridTemplateColumns: "1fr 1fr 120px 1fr 90px",
                        gap: 8,
                      }}
                    >
                      <select
                        className="input"
                        value={it.idProducto}
                        onChange={async (e) => {
                          const v = e.target.value;
                          setItems((arr) =>
                            arr.map((row, i) =>
                              i === idx
                                ? { ...row, idProducto: v, idVariante: "" }
                                : row
                            )
                          );
                          await loadVariantesByProducto(v);
                        }}
                        required
                      >
                        <option value="">Producto…</option>
                        {productos.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>

                      <select
                        className="input"
                        value={it.idVariante}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((row, i) =>
                              i === idx
                                ? { ...row, idVariante: e.target.value }
                                : row
                            )
                          )
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

                      <input
                        className="input"
                        inputMode="numeric"
                        pattern="^[0-9]+$"
                        placeholder="Cant."
                        value={it.cantidad}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((row, i) =>
                              i === idx
                                ? { ...row, cantidad: e.target.value }
                                : row
                            )
                          )
                        }
                        required
                      />

                      <input
                        className="input"
                        placeholder="Motivo (opcional)"
                        value={it.motivo}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((row, i) =>
                              i === idx
                                ? { ...row, motivo: e.target.value }
                                : row
                            )
                          )
                        }
                      />

                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => removeItemRow(idx)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpenDrawer(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  Crear devolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
