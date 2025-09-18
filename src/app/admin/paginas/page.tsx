"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ========= Icons (mismos estilos que tus módulos) ========= */
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

/* ========= Tipos ========= */
type Pagina = {
  id: number;
  slug: string;
  titulo: string;
  contenido: string;
  activo: boolean;
  orden: number;
};

type Dir = "asc" | "desc";
type Order = "orden" | "titulo" | "creado";

type FormState = {
  titulo: string;
  slug: string;
  contenido: string;
  orden: string; // numeric text
  activo: boolean;
};

/* ========= Helpers ========= */
const safeSlug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\-_/]/gu, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

/* ========= Página ========= */
export default function PaginasCMSAdmin() {
  const [rows, setRows] = useState<Pagina[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState<"" | "true" | "false">("");
  const [order, setOrder] = useState<Order>("orden");
  const [dir, setDir] = useState<Dir>("asc");

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // drawer: crear/editar
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pagina | null>(null);
  const [autoslug, setAutoslug] = useState(true);
  const [form, setForm] = useState<FormState>({
    titulo: "",
    slug: "",
    contenido: "<h2>Nueva página</h2><p>Escribe aquí el contenido HTML…</p>",
    orden: "0",
    activo: true,
  });

  // modal de vista
  const [viewing, setViewing] = useState<Pagina | null>(null);

  /* ====== Cargar ====== */
  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (onlyActive) sp.set("activo", onlyActive);
    sp.set("order", order);
    sp.set("dir", dir);
    const res = await fetch(`/api/admin/paginas?${sp.toString()}`);
    const data = (await res.json()) as Pagina[];
    setRows(data);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    void load();
  }, []);

  /* ====== Export PDF ====== */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Páginas CMS - BESO", 14, 14);
    const body: RowInput[] = rows.map((p) => [
      p.id,
      p.titulo,
      p.slug,
      p.activo ? "Sí" : "No",
      p.orden,
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Título", "Slug", "Activo", "Orden"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("paginas_cms.pdf");
    alert("PDF generado.");
  };

  /* ====== Crear / Editar ====== */
  const openCreate = () => {
    setEditing(null);
    setAutoslug(true);
    setForm({
      titulo: "",
      slug: "",
      contenido: "<h2>Nueva página</h2><p>Escribe aquí el contenido HTML…</p>",
      orden: "0",
      activo: true,
    });
    setOpen(true);
  };

  const openEdit = (p: Pagina) => {
    setEditing(p);
    setAutoslug(false);
    setForm({
      titulo: p.titulo,
      slug: p.slug,
      contenido: p.contenido,
      orden: String(p.orden ?? 0),
      activo: p.activo,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titulo = form.titulo.trim();
    const slug = (autoslug ? safeSlug(titulo || "pagina") : form.slug).trim();
    const contenido = form.contenido.trim();
    const orden = Number.parseInt(form.orden || "0", 10);
    const activo = !!form.activo;

    if (!titulo) return alert("El título es requerido.");
    if (!slug) return alert("El slug es requerido.");
    if (!contenido) return alert("El contenido es requerido.");

    const payload = { titulo, slug, contenido, orden, activo } as const;

    const url = editing
      ? `/api/admin/paginas/${editing.id}`
      : "/api/admin/paginas";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo guardar la página.");
      return;
    }

    setOpen(false);
    await load();
    alert(editing ? "Página actualizada." : "Página creada.");
  };

  const onDelete = async (p: Pagina) => {
    if (!confirm(`Eliminar página: “${p.titulo}”?`)) return;
    const res = await fetch(`/api/admin/paginas/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo eliminar.");
      return;
    }
    await load();
    alert("Página eliminada.");
  };

  /* ====== Paginación ====== */
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  /* ====== Render ====== */
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Páginas CMS</h1>

      {/* Barra de filtros/acciones */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, slug o contenido…"
            style={{ minWidth: 280 }}
          />

          <select
            className="input"
            value={onlyActive}
            onChange={(e) =>
              setOnlyActive(e.target.value as "" | "true" | "false")
            }
            style={{ width: 160 }}
          >
            <option value="">— Todas —</option>
            <option value="true">Solo activas</option>
            <option value="false">Solo inactivas</option>
          </select>

          <select
            className="input"
            value={order}
            onChange={(e) => setOrder(e.target.value as Order)}
            style={{ width: 160 }}
            title="Ordenar por"
          >
            <option value="orden">Orden</option>
            <option value="titulo">Título</option>
            <option value="creado">Creado (ID)</option>
          </select>

          <select
            className="input"
            value={dir}
            onChange={(e) => setDir(e.target.value as Dir)}
            style={{ width: 120 }}
            title="Dirección"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>

          <button className="btn" onClick={load} disabled={loading}>
            Filtrar
          </button>

          <div className="muted ml-auto">Total: {count}</div>

          <button className="icon-btn" onClick={exportPDF} title="Exportar PDF">
            <PdfIcon />
          </button>
          <button className="btn primary" onClick={openCreate}>
            <PlusIcon style={{ marginRight: 8 }} />
            Nueva página
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Título</th>
              <th>Slug</th>
              <th style={{ width: 90 }}>Orden</th>
              <th style={{ width: 100 }}>Activo</th>
              <th style={{ width: 160 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.titulo}</td>
                <td className="muted">{p.slug}</td>
                <td>{p.orden}</td>
                <td>{p.activo ? "Sí" : "No"}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <Link
                    href={`/pages/${p.slug}`}
                    className="icon-btn"
                    title="Ver en sitio"
                    target="_blank"
                  >
                    <ViewIcon />
                  </Link>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(p)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => void onDelete(p)}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted text-center p-4">
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

      {/* Modal de vista rápida */}
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
              margin: "3% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(980px, 96%)",
              maxHeight: "92vh",
              overflow: "auto",
              display: "grid",
              gap: 12,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{viewing.titulo}</h3>
              <button
                className="icon-btn"
                title="Cerrar"
                onClick={() => setViewing(null)}
              >
                <CloseIcon />
              </button>
            </div>
            <article
              className="panel"
              style={{ padding: 12, lineHeight: 1.75 }}
            >
              <div dangerouslySetInnerHTML={{ __html: viewing.contenido }} />
            </article>
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
              width: "min(860px, 96vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
              display: "grid",
              gridTemplateRows: "auto 1fr",
              gap: 12,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">
                {editing ? "Editar página" : "Nueva página"}
              </h3>
              <button
                className="icon-btn"
                title="Cerrar"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
              <div
                className="grid"
                style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Título</span>
                  <input
                    className="input"
                    value={form.titulo}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        titulo: v,
                        slug: autoslug ? safeSlug(v || "pagina") : f.slug,
                      }));
                    }}
                    required
                  />
                </label>

                <label className="grid gap-1">
                  <span>Slug</span>
                  <div className="flex items-center gap-2">
                    <input
                      className="input"
                      value={
                        autoslug ? safeSlug(form.titulo || "pagina") : form.slug
                      }
                      onChange={(e) => {
                        setAutoslug(false);
                        setForm((f) => ({ ...f, slug: e.target.value }));
                      }}
                      required
                    />
                    <label
                      className="flex items-center gap-2 muted"
                      title="Generar desde título"
                    >
                      <input
                        type="checkbox"
                        checked={autoslug}
                        onChange={(e) => setAutoslug(e.target.checked)}
                      />
                      Auto
                    </label>
                  </div>
                </label>
              </div>

              <div
                className="grid"
                style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Orden</span>
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    value={form.orden}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, orden: e.target.value }))
                    }
                  />
                </label>

                <label className="grid gap-1">
                  <span>Activo</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, activo: e.target.checked }))
                      }
                    />
                    <span className="muted">Visible en el sitio</span>
                  </div>
                </label>
              </div>

              <div
                className="grid"
                style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Contenido (HTML)</span>
                  <textarea
                    className="input"
                    style={{
                      height: 380,
                      fontFamily: "ui-monospace, monospace",
                    }}
                    value={form.contenido}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contenido: e.target.value }))
                    }
                    placeholder="<h2>Título</h2><p>Texto…</p>"
                    required
                  />
                </label>

                <div className="grid gap-1">
                  <span className="muted">Preview</span>
                  <article
                    className="panel"
                    style={{
                      padding: 12,
                      height: 380,
                      overflow: "auto",
                      lineHeight: 1.75,
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: form.contenido }} />
                  </article>
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
                <button className="btn primary">
                  {editing ? "Guardar cambios" : "Crear página"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
