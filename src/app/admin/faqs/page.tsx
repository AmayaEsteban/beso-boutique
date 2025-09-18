"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ==== Tipos ==== */
type FAQ = {
  id: number;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
};
type FormState = {
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
};

/* ==== Iconos (mismo set visual) ==== */
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

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros/paginación
  const [q, setQ] = useState("");
  const [orderBy, setOrderBy] = useState<"orden" | "id">("orden");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // drawer
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState<FormState>({
    pregunta: "",
    respuesta: "",
    orden: 0,
    activo: true,
  });

  const fetchFaqs = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("order", orderBy);
    sp.set("dir", dir);
    const res = await fetch(`/api/admin/faqs?${sp.toString()}`);
    const data = (await res.json()) as FAQ[];
    setFaqs(data);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    void fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ pregunta: "", respuesta: "", orden: 0, activo: true });
    setOpen(true);
  };
  const openEdit = (row: FAQ) => {
    setEditing(row);
    setForm({
      pregunta: row.pregunta,
      respuesta: row.respuesta,
      orden: row.orden,
      activo: row.activo,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      pregunta: form.pregunta.trim(),
      respuesta: form.respuesta.trim(),
      orden: Number.isFinite(form.orden) ? Number(form.orden) : 0,
      activo: Boolean(form.activo),
    };
    if (!payload.pregunta) return alert("La pregunta es obligatoria.");
    if (!payload.respuesta) return alert("La respuesta es obligatoria.");

    const url = editing ? `/api/admin/faqs/${editing.id}` : `/api/admin/faqs`;
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
    await fetchFaqs();
    alert(editing ? "FAQ actualizada." : "FAQ creada.");
  };

  const onDelete = async (row: FAQ) => {
    if (!confirm(`Eliminar FAQ: "${row.pregunta}" ?`)) return;
    const res = await fetch(`/api/admin/faqs/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await fetchFaqs();
    alert("FAQ eliminada.");
  };

  // paginación
  const count = faqs.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, count);

  const pageRows = useMemo(
    () => faqs.slice(startIndex, endIndex),
    [faqs, startIndex, endIndex]
  );

  useEffect(() => setPage(1), [pageSize]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Preguntas Frecuentes</h1>

      {/* Barra superior */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="input"
            placeholder="Buscar por pregunta o respuesta…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <select
            className="input"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value as "orden" | "id")}
            style={{ width: 160 }}
          >
            <option value="orden">Orden</option>
            <option value="id">ID</option>
          </select>
          <select
            className="input"
            value={dir}
            onChange={(e) => setDir(e.target.value as "asc" | "desc")}
            style={{ width: 140 }}
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
          <button className="btn" onClick={fetchFaqs} disabled={loading}>
            Filtrar
          </button>

          <div className="muted ml-auto">Total: {count}</div>

          <button className="btn primary" onClick={openCreate}>
            <PlusIcon style={{ marginRight: 8 }} />
            Nueva FAQ
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Pregunta</th>
              <th>Orden</th>
              <th style={{ width: 120 }}>Activo</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td
                  title={r.respuesta}
                  style={{
                    maxWidth: 580,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.pregunta}
                </td>
                <td>{r.orden}</td>
                <td>{r.activo ? "Sí" : "No"}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
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

      {/* Paginación */}
      <div className="panel p-3 mt-3 flex items-center justify-between">
        <div className="muted">
          Mostrando {count === 0 ? 0 : startIndex + 1}-{endIndex} de {count}
        </div>
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

      {/* Drawer crear/editar */}
      {open && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Editar FAQ" : "Nueva FAQ"}
          style={{ position: "fixed", inset: 0, zIndex: 1000 }}
          onClick={() => setOpen(false)}
        >
          <div
            className="admin-right-drawer-backdrop"
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
              width: "min(560px, 92vw)",
              background: "var(--panel)",
              color: "var(--ink)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              display: "grid",
              gridTemplateRows: "auto 1fr",
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">
                {editing ? "Editar FAQ" : "Nueva FAQ"}
              </h3>
              <button
                className="icon-btn"
                title="Cerrar"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <form className="grid gap-3" onSubmit={onSubmit}>
              <label className="grid gap-1">
                <span>Pregunta</span>
                <input
                  className="input"
                  value={form.pregunta}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pregunta: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="grid gap-1">
                <span>Respuesta</span>
                <textarea
                  className="input"
                  rows={6}
                  value={form.respuesta}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, respuesta: e.target.value }))
                  }
                  required
                />
              </label>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Orden</span>
                  <input
                    className="input"
                    type="number"
                    value={form.orden}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, orden: Number(e.target.value) }))
                    }
                  />
                </label>
                <label
                  className="flex items-center gap-2"
                  style={{ marginTop: 24 }}
                >
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, activo: e.target.checked }))
                    }
                  />
                  <span>Activo</span>
                </label>
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
                  {editing ? "Guardar cambios" : "Crear FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
