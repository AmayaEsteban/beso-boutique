// src/app/admin/colores/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ================= Icons (mismo set que usuarios/productos) ================= */
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

/* ========================= Tipos ========================= */
type Color = { id: number; nombre: string; hex: string | null };

type FormState = {
  id?: number;
  nombre: string;
  hex: string; // input string, se valida
};

type OrderField = "id" | "nombre";
type Dir = "asc" | "desc";

/* ========================= Utils ========================= */
const HEX_RE = /^#([0-9A-Fa-f]{6})$/;
const isHexOrEmpty = (s: string) => s.trim() === "" || HEX_RE.test(s.trim());

/* ========================= Página ========================= */
export default function ColoresPage() {
  const [rows, setRows] = useState<Color[]>([]);
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
  const [viewing, setViewing] = useState<Color | null>(null);

  // drawer crear/editar
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Color | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: "", hex: "" });

  /* --------------------- Data --------------------- */
  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("order", order);
    sp.set("dir", dir);
    const res = await fetch(`/api/admin/colores?${sp.toString()}`);
    const data = (await res.json()) as Color[];
    setRows(data);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    void load();
  }, []);

  /* --------------------- CRUD --------------------- */
  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: "", hex: "" });
    setOpen(true);
  };

  const openEdit = (c: Color) => {
    setEditing(c);
    setForm({ id: c.id, nombre: c.nombre, hex: c.hex ?? "" });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre es requerido.");
      return;
    }
    if (!isHexOrEmpty(form.hex)) {
      alert("HEX inválido. Usa #RRGGBB o déjalo vacío.");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      hex: form.hex.trim() === "" ? null : form.hex.trim(),
    };

    const url = editing
      ? `/api/admin/colores/${editing.id}`
      : `/api/admin/colores`;
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al guardar color");
      return;
    }
    setOpen(false);
    await load();
    alert(editing ? "Color actualizado." : "Color creado.");
  };

  const onDelete = async (c: Color) => {
    if (!confirm(`Eliminar el color "${c.nombre}"?`)) return;
    const res = await fetch(`/api/admin/colores/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await load();
    alert("Color eliminado.");
  };

  /* --------------------- Export PDF --------------------- */
  const exportPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = rows.map((c) => [c.id, c.nombre, c.hex ?? "-"]);
    doc.text("Colores - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nombre", "HEX"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 80 },
        2: { cellWidth: 35 },
      },
    });
    doc.save("colores.pdf");
    alert("PDF de colores generado.");
  };

  const exportColorPDF = (c: Color) => {
    const doc = new jsPDF();
    const rows: RowInput[] = [
      ["ID", String(c.id)],
      ["Nombre", c.nombre],
      ["HEX", c.hex ?? "-"],
    ];
    doc.text(`Color #${c.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`color_${c.id}.pdf`);
    alert(`PDF del color #${c.id} generado.`);
  };

  /* --------------------- Paginación --------------------- */
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

  /* --------------------- Render --------------------- */
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Colores</h1>

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
              aria-label="Exportar PDF"
              onClick={exportPDF}
            >
              <PdfIcon />
            </button>
            <button className="btn primary" onClick={openCreate}>
              <PlusIcon style={{ marginRight: 8 }} />
              Nuevo color
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              className="input"
              placeholder="Buscar por nombre o HEX…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 240 }}
            />
            <span className="muted">Orden:</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as OrderField)}
              style={{ width: 140 }}
            >
              <option value="id">ID</option>
              <option value="nombre">Nombre</option>
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

            {/* Page size arriba */}
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
              <th>Nombre</th>
              <th style={{ width: 110 }}>HEX</th>
              <th style={{ width: 80 }}>Muestra</th>
              <th style={{ width: 140 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.hex ?? "-"}</td>
                <td>
                  {c.hex ? (
                    <span
                      title={c.hex}
                      style={{
                        display: "inline-block",
                        width: 28,
                        height: 18,
                        borderRadius: 4,
                        border: "1px solid var(--stroke)",
                        background: c.hex,
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(c)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(c)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => onDelete(c)}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted text-center p-4">
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
              width: "min(520px, 92%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de color</h3>
              <div className="flex items-center gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportColorPDF(viewing)}
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
              <b>Nombre:</b> {viewing.nombre}
            </p>
            <p>
              <b>HEX:</b> {viewing.hex ?? "-"}
            </p>
            {viewing.hex && (
              <div style={{ marginTop: 10 }}>
                <span className="muted" style={{ marginRight: 8 }}>
                  Muestra:
                </span>
                <span
                  title={viewing.hex}
                  style={{
                    display: "inline-block",
                    width: 48,
                    height: 28,
                    borderRadius: 6,
                    border: "1px solid var(--stroke)",
                    background: viewing.hex,
                    verticalAlign: "middle",
                  }}
                />
              </div>
            )}
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
            role="document"
            onClick={(e) => e.stopPropagation()}
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
                {editing ? "Editar color" : "Nuevo color"}
              </h3>
              <button className="btn ghost" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3">
              <label className="grid gap-1">
                <span>Nombre</span>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  required
                />
              </label>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr auto" }}
              >
                <label className="grid gap-1">
                  <span>HEX (opcional)</span>
                  <input
                    className="input"
                    placeholder="#RRGGBB"
                    value={form.hex}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hex: e.target.value }))
                    }
                    title="Formato #RRGGBB"
                  />
                </label>
                <div className="grid gap-1">
                  <span className="muted">Muestra</span>
                  <span
                    aria-label="Muestra de color"
                    style={{
                      display: "inline-block",
                      width: 40,
                      height: 32,
                      borderRadius: 6,
                      border: "1px solid var(--stroke)",
                      background: HEX_RE.test(form.hex.trim())
                        ? form.hex.trim()
                        : "transparent",
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  {editing ? "Guardar cambios" : "Crear color"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
