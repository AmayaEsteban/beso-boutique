"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* Tipos */
type Dir = "asc" | "desc";
type OrderField = "fecha" | "id";

type PagoProv = {
  id: number;
  idCompra: number;
  monto: number;
  metodo: string | null;
  referencia: string | null;
  fecha: string; // ISO
  nota: string | null;
  compra: {
    id: number;
    idProveedor: number;
    proveedor: { nombre: string } | null;
  };
};

type Filtros = {
  proveedor: string;
  compra: string;
  desde: string;
  hasta: string;
  order: OrderField;
  dir: Dir;
};

/* Icons */
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

/* Page */
export default function PagosProveedorPage() {
  const [rows, setRows] = useState<PagoProv[]>([]);
  const [filters, setFilters] = useState<Filtros>({
    proveedor: "",
    compra: "",
    desde: "",
    hasta: "",
    order: "fecha",
    dir: "desc",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [viewing, setViewing] = useState<PagoProv | null>(null);

  const load = async () => {
    const sp = new URLSearchParams();
    if (filters.proveedor) sp.set("proveedor", filters.proveedor);
    if (filters.compra) sp.set("compra", filters.compra);
    if (filters.desde) sp.set("desde", filters.desde);
    if (filters.hasta) sp.set("hasta", filters.hasta);
    sp.set("order", filters.order);
    sp.set("dir", filters.dir);
    const res = await fetch(`/api/admin/pagos-proveedor?${sp.toString()}`);
    const data = (await res.json()) as PagoProv[];
    setRows(data);
    setPage(1);
  };

  useEffect(() => {
    void load();
  }, []);

  /* paginación */
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  /* PDF lista */
  const exportListPDF = () => {
    const doc = new jsPDF();
    doc.text("Pagos a Proveedor - BESO", 14, 14);
    const body: RowInput[] = rows.map((p) => [
      p.id,
      new Date(p.fecha).toLocaleString(),
      p.compra.proveedor?.nombre ?? `#${p.compra.idProveedor}`,
      p.idCompra,
      `Q ${p.monto.toFixed(2)}`,
      p.metodo ?? "-",
      p.referencia ?? "-",
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Fecha", "Proveedor", "Compra", "Monto", "Método", "Ref."]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("pagos_proveedor.pdf");
    alert("PDF de lista generado.");
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Pagos a Proveedor</h1>

      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="muted">Total: {count}</div>
          <div className="flex items-center gap-2">
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
              {count ? start + 1 : 0}-{end} de {count}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="btn ghost"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
            <button
              className="icon-btn"
              title="Exportar PDF"
              onClick={exportListPDF}
            >
              <PdfIcon />
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <input
              className="input"
              placeholder="ID Proveedor…"
              value={filters.proveedor}
              onChange={(e) =>
                setFilters((f) => ({ ...f, proveedor: e.target.value }))
              }
              style={{ width: 160 }}
            />
            <input
              className="input"
              placeholder="ID Compra…"
              value={filters.compra}
              onChange={(e) =>
                setFilters((f) => ({ ...f, compra: e.target.value }))
              }
              style={{ width: 140 }}
            />
            <input
              className="input"
              type="date"
              value={filters.desde}
              onChange={(e) =>
                setFilters((f) => ({ ...f, desde: e.target.value }))
              }
            />
            <input
              className="input"
              type="date"
              value={filters.hasta}
              onChange={(e) =>
                setFilters((f) => ({ ...f, hasta: e.target.value }))
              }
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

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Compra</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Referencia</th>
              <th style={{ width: 90 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{new Date(p.fecha).toLocaleString()}</td>
                <td>
                  {p.compra.proveedor?.nombre ?? `#${p.compra.idProveedor}`}
                </td>
                <td>{p.idCompra}</td>
                <td>{`Q ${p.monto.toFixed(2)}`}</td>
                <td>{p.metodo ?? "-"}</td>
                <td>{p.referencia ?? "-"}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver detalle"
                    onClick={() => setViewing(p)}
                  >
                    <ViewIcon />
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
              width: "min(560px, 92%)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de pago</h3>
              <button
                className="icon-btn"
                onClick={() => setViewing(null)}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <p>
              <b>ID:</b> {viewing.id}
            </p>
            <p>
              <b>Fecha:</b> {new Date(viewing.fecha).toLocaleString()}
            </p>
            <p>
              <b>Proveedor:</b>{" "}
              {viewing.compra.proveedor?.nombre ??
                `#${viewing.compra.idProveedor}`}
            </p>
            <p>
              <b>Compra:</b> {viewing.idCompra}
            </p>
            <p>
              <b>Monto:</b> {`Q ${viewing.monto.toFixed(2)}`}
            </p>
            <p>
              <b>Método:</b> {viewing.metodo ?? "-"}
            </p>
            <p>
              <b>Referencia:</b> {viewing.referencia ?? "-"}
            </p>
            <p>
              <b>Nota:</b> {viewing.nota ?? "-"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
