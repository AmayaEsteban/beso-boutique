"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Cliente as ClienteModel } from "@prisma/client"; // 👈 usa el modelo directo
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { format } from "date-fns";

/* ====== Tipos ====== */
type Cliente = ClienteModel;

/* ====== Íconos (reutilizados del estilo de Usuarios) ====== */
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

/* ====== Página ====== */
export default function ClientesPage() {
  /* Estado base */
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  /* Filtros */
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Paginación */
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  /* Modal de detalle */
  const [viewing, setViewing] = useState<Cliente | null>(null);

  /* Carga de clientes */
  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    const res = await fetch(`/api/admin/clientes?${sp.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al cargar clientes");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Cliente[];
    setRows(data);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Eliminar */
  const onDelete = async (c: Cliente) => {
    if (!confirm(`Eliminar al cliente "${c.nombre}"?`)) return;
    const res = await fetch(`/api/admin/clientes/${c.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await load();
    alert("Cliente eliminado.");
  };

  /* PDF lista */
  const exportListPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = rows.map((c) => [
      c.id,
      c.nombre,
      c.email ?? "-",
      c.telefono ?? "-",
      c.direccion ?? "-",
      format(new Date(c.fecha_registro), "yyyy-MM-dd HH:mm"),
    ]);
    doc.text("Clientes - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nombre", "Email", "Teléfono", "Dirección", "Fecha"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("clientes.pdf");
    alert("PDF de clientes generado.");
  };

  /* PDF individual */
  const exportClientPDF = (c: Cliente) => {
    const doc = new jsPDF();
    const rowsPdf: RowInput[] = [
      ["ID", String(c.id)],
      ["Nombre", c.nombre],
      ["Email", c.email ?? "-"],
      ["Teléfono", c.telefono ?? "-"],
      ["Dirección", c.direccion ?? "-"],
      [
        "Fecha registro",
        format(new Date(c.fecha_registro), "yyyy-MM-dd HH:mm"),
      ],
    ];
    doc.text(`Cliente #${c.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rowsPdf,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`cliente_${c.id}.pdf`);
    alert(`PDF del cliente #${c.id} generado.`);
  };

  /* Paginación client-side */
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);

  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  /* UI */
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      {/* Barra superior con filtros plegables y acciones */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
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
              aria-label="Exportar PDF"
            >
              <PdfIcon />
            </button>
          </div>

          {/* Paginación arriba */}
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
              {start + 1}-{end} de {count}
            </span>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <input
              className="input"
              placeholder="Buscar por nombre o correo…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <button className="btn" onClick={load} disabled={loading}>
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
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Fecha registro</th>
              <th style={{ width: 110 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.email ?? "—"}</td>
                <td>{c.telefono ?? "—"}</td>
                <td>
                  {format(new Date(c.fecha_registro), "yyyy-MM-dd HH:mm")}
                </td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    onClick={() => setViewing(c)}
                    title="Ver información"
                    aria-label="Ver información"
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => onDelete(c)}
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4">
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
          Mostrando {start + 1}-{end} de {count}
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="btn"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            « Anterior
          </button>
          <div className="muted">
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
          role="dialog"
          aria-modal="true"
          aria-label="Detalle de cliente"
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--panel)",
              color: "var(--ink)",
              margin: "5% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(520px, 92%)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de cliente</h3>
              <div className="flex items-center gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportClientPDF(viewing)}
                >
                  <PdfIcon />
                </button>
                <button className="btn" onClick={() => setViewing(null)}>
                  Cerrar
                </button>
              </div>
            </div>

            <p>
              <b>ID:</b> {viewing.id}
            </p>
            <p>
              <b>Nombre:</b> {viewing.nombre}
            </p>
            <p>
              <b>Email:</b> {viewing.email ?? "—"}
            </p>
            <p>
              <b>Teléfono:</b> {viewing.telefono ?? "—"}
            </p>
            <p>
              <b>Dirección:</b> {viewing.direccion ?? "—"}
            </p>
            <p>
              <b>Fecha registro:</b>{" "}
              {format(new Date(viewing.fecha_registro), "yyyy-MM-dd HH:mm")}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
