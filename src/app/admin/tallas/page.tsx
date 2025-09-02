// src/app/admin/tallas/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ================= Icons (mismo set global) ================= */
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

/* ================= Tipos ================= */
type Talla = { id: number; codigo: string; orden: number };

type FormState = {
  id?: number;
  codigo: string;
  orden: string; // input text → se parsea a int
};

type OrderField = "id" | "codigo" | "orden";
type Dir = "asc" | "desc";

/* ================= Helpers ================= */
const onlyCode = (s: string) => s.replace(/[^A-Za-z0-9\-_.]/g, "").slice(0, 10);
const toInt = (s: string) => {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};

/* ================= Page ================= */
export default function TallasPage() {
  const [rows, setRows] = useState<Talla[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<OrderField>("id");
  const [dir, setDir] = useState<Dir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // modal detalle
  const [viewing, setViewing] = useState<Talla | null>(null);

  // drawer crear/editar
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Talla | null>(null);
  const [form, setForm] = useState<FormState>({ codigo: "", orden: "0" });

  /* -------- Data -------- */
  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("order", order);
    sp.set("dir", dir);
    const res = await fetch(`/api/admin/tallas?${sp.toString()}`);
    const data = (await res.json()) as Talla[];
    setRows(data);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    void load();
  }, []);

  /* -------- CRUD -------- */
  const openCreate = () => {
    setEditing(null);
    setForm({ codigo: "", orden: "0" });
    setOpen(true);
  };

  const openEdit = (t: Talla) => {
    setEditing(t);
    setForm({ id: t.id, codigo: t.codigo, orden: String(t.orden) });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const codigo = onlyCode(form.codigo).trim();
    const orden = Math.max(0, toInt(form.orden));

    if (!codigo) {
      alert("El código es requerido (letras/números, máx 10).");
      return;
    }

    const payload = { codigo, orden };

    const url = editing
      ? `/api/admin/tallas/${editing.id}`
      : `/api/admin/tallas`;
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al guardar talla");
      return;
    }
    setOpen(false);
    await load();
    alert(editing ? "Talla actualizada." : "Talla creada.");
  };

  const onDelete = async (t: Talla) => {
    if (!confirm(`Eliminar la talla "${t.codigo}"?`)) return;
    const res = await fetch(`/api/admin/tallas/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await load();
    alert("Talla eliminada.");
  };

  /* -------- PDF -------- */
  const exportPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = rows.map((t) => [t.id, t.codigo, t.orden]);
    doc.text("Tallas - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Código", "Orden"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("tallas.pdf");
    alert("PDF de tallas generado.");
  };

  const exportTallaPDF = (t: Talla) => {
    const doc = new jsPDF();
    const rowsPDF: RowInput[] = [
      ["ID", String(t.id)],
      ["Código", t.codigo],
      ["Orden", String(t.orden)],
    ];
    doc.text(`Talla #${t.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rowsPDF,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`talla_${t.id}.pdf`);
    alert(`PDF de la talla #${t.id} generado.`);
  };

  /* -------- Paginación -------- */
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, count);

  const pageRows = useMemo(
    () => rows.slice(startIndex, endIndex),
    [rows, startIndex, endIndex]
  );

  useEffect(() => setPage(1), [pageSize]);

  /* -------- Render -------- */
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Tallas</h1>

      {/* Barra superior */}
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
              onClick={exportPDF}
            >
              <PdfIcon />
            </button>
            <button className="btn primary" onClick={openCreate}>
              <PlusIcon style={{ marginRight: 8 }} />
              Nueva talla
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              className="input"
              placeholder="Buscar por código…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <span className="muted">Orden:</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as OrderField)}
              style={{ width: 140 }}
            >
              <option value="id">ID</option>
              <option value="codigo">Código</option>
              <option value="orden">Orden</option>
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
              <th>Código</th>
              <th style={{ width: 110 }}>Orden</th>
              <th style={{ width: 140 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.codigo}</td>
                <td>{t.orden}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(t)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(t)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => onDelete(t)}
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
              margin: "5% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(520px, 92%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de talla</h3>
              <div className="flex items-center gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportTallaPDF(viewing)}
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
              <b>Código:</b> {viewing.codigo}
            </p>
            <p>
              <b>Orden:</b> {viewing.orden}
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
                {editing ? "Editar talla" : "Nueva talla"}
              </h3>
              <button className="btn ghost" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3">
              <label className="grid gap-1">
                <span>Código</span>
                <input
                  className="input"
                  value={form.codigo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codigo: onlyCode(e.target.value) }))
                  }
                  placeholder="S, M, L, 36, 38…"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span>Orden</span>
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
                  {editing ? "Guardar cambios" : "Crear talla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
