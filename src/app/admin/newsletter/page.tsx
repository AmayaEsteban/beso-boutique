"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos ===== */
type Dir = "asc" | "desc";
type OrderField = "id" | "fecha" | "email";

type Suscriptor = {
  id: number;
  email: string;
  activo: boolean;
  creado_en: string; // ISO
};

/* ===== Iconos coherentes ===== */
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
/* — Ojito (ver) — */
function ViewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 5C4.367 5 1 12 1 12s3.367 7 11 7 11-7 11-7-3.367-7-11-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
/* — Toggle ON/OFF con iconos — */
function ToggleOnIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 20" width="32" height="18" {...props} aria-hidden>
      <rect
        x="1"
        y="1"
        width="34"
        height="18"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="26" cy="10" r="6" fill="currentColor" />
    </svg>
  );
}
function ToggleOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 20" width="32" height="18" {...props} aria-hidden>
      <rect
        x="1"
        y="1"
        width="34"
        height="18"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="10" cy="10" r="6" fill="currentColor" />
    </svg>
  );
}

/* ===== Helpers ===== */
const isEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim().toLowerCase());

/* ===== Página ===== */
export default function NewsletterAdminPage() {
  const [rows, setRows] = useState<Suscriptor[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState<"" | "true" | "false">("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [order, setOrder] = useState<OrderField>("fecha");
  const [dir, setDir] = useState<Dir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // paginación
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // drawer
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Suscriptor | null>(null);
  const [email, setEmail] = useState("");

  // detalle (modal)
  const [viewing, setViewing] = useState<Suscriptor | null>(null);

  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (activo) sp.set("activo", activo);
    if (desde) sp.set("desde", desde);
    if (hasta) sp.set("hasta", hasta);
    sp.set("order", order);
    sp.set("dir", dir);
    const res = await fetch(`/api/admin/newsletter?${sp.toString()}`);
    const data = (await res.json()) as Suscriptor[];
    setRows(data);
    setPage(1);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  // paginated
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  const openCreate = () => {
    setEditing(null);
    setEmail("");
    setOpen(true);
  };
  const openEdit = (r: Suscriptor) => {
    setEditing(r);
    setEmail(r.email);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMail = email.trim().toLowerCase();
    if (!isEmail(eMail)) {
      alert("Email inválido.");
      return;
    }
    const url = editing
      ? `/api/admin/newsletter/${editing.id}`
      : `/api/admin/newsletter`;
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: eMail }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al guardar");
      return;
    }
    setOpen(false);
    await load();
    alert(editing ? "Suscriptor actualizado." : "Suscriptor creado.");
  };

  const toggleActivo = async (r: Suscriptor) => {
    const res = await fetch(`/api/admin/newsletter/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !r.activo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al actualizar estado");
      return;
    }
    await load();
  };

  const onDelete = async (r: Suscriptor) => {
    if (!confirm(`Eliminar suscriptor ${r.email}?`)) return;
    const res = await fetch(`/api/admin/newsletter/${r.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo eliminar");
      return;
    }
    await load();
  };

  // export CSV
  const exportCSV = () => {
    const header = "id,email,activo,creado_en\n";
    const body = rows
      .map(
        (r) =>
          `${r.id},"${r.email.replace(/"/g, '""')}",${
            r.activo ? 1 : 0
          },${new Date(r.creado_en).toISOString()}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suscriptores.csv";
    a.click();
    URL.revokeObjectURL(url);
    alert("CSV exportado.");
  };

  // export PDF listado
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Suscriptores Newsletter - BESO", 14, 14);
    const body: RowInput[] = rows.map((r) => [
      r.id,
      r.email,
      r.activo ? "Sí" : "No",
      new Date(r.creado_en).toLocaleString(),
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Email", "Activo", "Creado"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("suscriptores.pdf");
    alert("PDF generado.");
  };

  // export PDF detalle
  const exportOnePDF = (r: Suscriptor) => {
    const doc = new jsPDF();
    doc.text(`Suscriptor #${r.id}`, 14, 14);
    const body: RowInput[] = [
      ["ID", String(r.id)],
      ["Email", r.email],
      ["Activo", r.activo ? "Sí" : "No"],
      ["Creado", new Date(r.creado_en).toLocaleString()],
    ];
    autoTable(doc, {
      startY: 22,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`suscriptor_${r.id}.pdf`);
    alert("PDF del suscriptor generado.");
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Suscriptores (Newsletter)</h1>

      {/* Barra superior + acciones */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn ghost"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          <div className="muted ml-auto">Total: {rows.length}</div>

          <button className="btn ghost" onClick={exportCSV}>
            Exportar CSV
          </button>
          <button className="icon-btn" onClick={exportPDF} title="Exportar PDF">
            <PdfIcon />
          </button>
          <button className="btn primary" onClick={openCreate}>
            <PlusIcon style={{ marginRight: 8 }} />
            Nuevo suscriptor
          </button>
        </div>

        {/* Filtros colapsables */}
        {filtersOpen && (
          <div
            className="mt-3"
            style={{
              display: "flex",
              gap: ".5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              className="input"
              placeholder="Buscar por email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <select
              className="input"
              value={activo}
              onChange={(e) =>
                setActivo(e.target.value as "" | "true" | "false")
              }
              style={{ width: 180 }}
            >
              <option value="">Estado (todos)</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
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

            <span className="muted">Ordenar:</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as OrderField)}
              style={{ width: 140 }}
            >
              <option value="fecha">Fecha</option>
              <option value="email">Email</option>
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

            {/* Paginación compacta aquí también si la quieres a mano */}
            <span className="muted ml-auto">Ver:</span>
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
        )}
      </div>

      {/* Tabla */}
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Email</th>
              <th style={{ width: 120 }}>Estado</th>
              <th style={{ width: 200 }}>Creado</th>
              <th style={{ width: 170 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.email}</td>
                <td>
                  <button
                    className="icon-btn"
                    title={r.activo ? "Activo" : "Inactivo"}
                    onClick={() => toggleActivo(r)}
                  >
                    {r.activo ? <ToggleOnIcon /> : <ToggleOffIcon />}
                  </button>
                </td>
                <td>{new Date(r.creado_en).toLocaleString()}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver detalle"
                    onClick={() => setViewing(r)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(r)}
                  >
                    <EditIcon />
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
                <td colSpan={5} className="muted text-center p-4">
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

      {/* Modal Detalle */}
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
              margin: "6% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(520px, 92%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Detalle de suscriptor</h3>
              <div className="flex gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportOnePDF(viewing)}
                >
                  <PdfIcon />
                </button>
                <button
                  className="icon-btn"
                  title="Cerrar"
                  onClick={() => setViewing(null)}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
            <p>
              <b>ID:</b> {viewing.id}
            </p>
            <p>
              <b>Email:</b> {viewing.email}
            </p>
            <p>
              <b>Estado:</b> {viewing.activo ? "Activo" : "Inactivo"}
            </p>
            <p>
              <b>Creado:</b> {new Date(viewing.creado_en).toLocaleString()}
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
              width: "min(520px,92vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              display: "grid",
              gridTemplateRows: "auto 1fr",
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">
                {editing ? "Editar suscriptor" : "Nuevo suscriptor"}
              </h3>
              <button
                className="icon-btn"
                title="Cerrar"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <form className="grid gap-3" onSubmit={submit}>
              <label className="grid gap-1">
                <span>Email</span>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  required
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
                  {editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
