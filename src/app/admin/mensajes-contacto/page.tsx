"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos ===== */
type Mensaje = {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  asunto: string | null;
  mensaje: string;
  creado_en: string; // ISO
};

type OrderField = "fecha" | "id";
type Dir = "asc" | "desc";

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

/* ===== Página ===== */
export default function MensajesContactoAdmin() {
  const [rows, setRows] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [order, setOrder] = useState<OrderField>("fecha");
  const [dir, setDir] = useState<Dir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // detalle
  const [viewing, setViewing] = useState<Mensaje | null>(null);

  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (desde) sp.set("desde", desde);
    if (hasta) sp.set("hasta", hasta);
    sp.set("order", order);
    sp.set("dir", dir);

    const res = await fetch(`/api/admin/mensajes-contacto?${sp.toString()}`);
    const data = (await res.json()) as Mensaje[];
    setRows(data);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    void load();
  }, []);

  // paginación memorizada
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  const onDelete = async (m: Mensaje) => {
    if (!confirm(`¿Eliminar el mensaje #${m.id} de ${m.nombre}?`)) return;
    const res = await fetch(`/api/admin/mensajes-contacto/${m.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo eliminar");
      return;
    }
    await load();
    alert("Mensaje eliminado.");
  };

  // PDF listado
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Mensajes de contacto - BESO", 14, 14);

    const body: RowInput[] = rows.map((r) => [
      r.id,
      new Date(r.creado_en).toLocaleString(),
      r.nombre,
      r.email,
      r.telefono ?? "-",
      r.asunto ?? "-",
    ]);

    autoTable(doc, {
      startY: 20,
      head: [["ID", "Fecha", "Nombre", "Email", "Teléfono", "Asunto"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 14 } },
    });
    doc.save("mensajes_contacto.pdf");
    alert("PDF generado.");
  };

  // PDF detalle
  const exportOnePDF = (r: Mensaje) => {
    const doc = new jsPDF();
    doc.text(`Mensaje #${r.id}`, 14, 14);
    const rowsTable: RowInput[] = [
      ["ID", String(r.id)],
      ["Fecha", new Date(r.creado_en).toLocaleString()],
      ["Nombre", r.nombre],
      ["Email", r.email],
      ["Teléfono", r.telefono ?? "-"],
      ["Asunto", r.asunto ?? "-"],
      ["Mensaje", r.mensaje],
    ];
    autoTable(doc, {
      startY: 22,
      head: [["Campo", "Valor"]],
      body: rowsTable,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      theme: "grid",
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 135 } },
    });
    doc.save(`mensaje_${r.id}.pdf`);
    alert("PDF del mensaje generado.");
  };

  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Mensajes de Contacto</h1>

      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="muted">Total: {count}</div>

          <button
            className="btn ghost ml-auto"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          <button className="icon-btn" title="Exportar PDF" onClick={exportPDF}>
            <PdfIcon />
          </button>
        </div>

        {filtersOpen && (
          <div className="flex gap-2 flex-wrap mt-3 items-center">
            <input
              className="input"
              placeholder="Buscar por nombre, email, teléfono, asunto o texto…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <input
              className="input"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
            <input
              className="input"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
            <span className="muted">Orden:</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as OrderField)}
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

            <button className="btn" onClick={load} disabled={loading}>
              Filtrar
            </button>

            <div className="ml-auto flex items-center gap-2">
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
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Fecha</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Asunto</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{new Date(r.creado_en).toLocaleString()}</td>
                <td>{r.nombre}</td>
                <td>{r.email}</td>
                <td>{r.telefono ?? "-"}</td>
                <td>{r.asunto ?? "-"}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(r)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => onDelete(r)}
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
              <h3 className="font-bold">Mensaje #{viewing.id}</h3>
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
              <b>Fecha:</b> {new Date(viewing.creado_en).toLocaleString()}
            </p>
            <p>
              <b>Nombre:</b> {viewing.nombre}
            </p>
            <p>
              <b>Email:</b> {viewing.email}
            </p>
            <p>
              <b>Teléfono:</b> {viewing.telefono ?? "-"}
            </p>
            <p>
              <b>Asunto:</b> {viewing.asunto ?? "-"}
            </p>
            <p>
              <b>Mensaje:</b>
            </p>
            <div className="panel p-3" style={{ whiteSpace: "pre-wrap" }}>
              {viewing.mensaje}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
