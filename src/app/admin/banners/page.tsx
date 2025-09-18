// src/app/admin/banners/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/* ===== Tipos ===== */
type Banner = {
  id: number;
  titulo: string | null;
  imagenUrl: string;
  linkUrl: string | null;
  orden: number;
  activo: boolean;
  publicado: string; // ISO
};

type FormState = {
  id?: number | null;
  titulo: string;
  imagenUrl: string;
  linkUrl: string;
  orden: string;
  activo: boolean;
};

/* ===== Iconos (coherentes con el resto del admin) ===== */
function ViewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
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
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
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
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
      <path
        d="M3 6h18M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
      <path
        d="M12 5l6 6M12 5L6 11M12 5v14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ArrowDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
      <path
        d="M12 19l6-6M12 19L6 13M12 19V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ===== Page ===== */
export default function AdminBannersPage() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [viewing, setViewing] = useState<Banner | null>(null);

  function emptyForm(): FormState {
    return {
      id: null,
      titulo: "",
      imagenUrl: "",
      linkUrl: "",
      orden: "0",
      activo: true,
    };
  }

  useEffect(() => {
    void load();
  }, []);

  async function load(): Promise<void> {
    const res = await fetch("/api/admin/banners");
    const data = (await res.json()) as Banner[];
    setRows(data);
  }

  function openCreate(): void {
    setForm(emptyForm());
    setOpenDrawer(true);
  }

  function openEdit(b: Banner): void {
    setForm({
      id: b.id,
      titulo: b.titulo ?? "",
      imagenUrl: b.imagenUrl,
      linkUrl: b.linkUrl ?? "",
      orden: String(b.orden ?? 0),
      activo: b.activo,
    });
    setOpenDrawer(true);
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);

    const payload = {
      titulo: form.titulo.trim() || null,
      imagenUrl: form.imagenUrl.trim(),
      linkUrl: form.linkUrl.trim() || null,
      orden: Number(form.orden) || 0,
      activo: form.activo,
    };

    const url = form.id
      ? `/api/admin/banners/${form.id}`
      : "/api/admin/banners";
    const method: "PUT" | "POST" = form.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err?.error ?? "Error al guardar");
      return;
    }

    setOpenDrawer(false);
    await load();
  }

  async function remove(b: Banner): Promise<void> {
    if (!confirm("¿Eliminar banner?")) return;
    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err?.error ?? "No se pudo eliminar");
      return;
    }
    await load();
  }

  async function toggleActivo(b: Banner): Promise<void> {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !b.activo }),
    });
    await load();
  }

  async function mover(b: Banner, delta: number): Promise<void> {
    const nuevo = Math.max(0, (b.orden ?? 0) + delta);
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orden: nuevo }),
    });
    await load();
  }

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.orden - b.orden || b.id - a.id),
    [rows]
  );

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Banners (Carrusel)</h1>

      <div className="panel p-4 mb-3 flex items-center justify-between">
        <div className="muted">Total: {rows.length}</div>
        <button className="btn primary" onClick={openCreate}>
          Nuevo banner
        </button>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Orden</th>
              <th>Preview</th>
              <th>Título</th>
              <th>Link</th>
              <th style={{ width: 100 }}>Activo</th>
              <th style={{ width: 200 }} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr key={b.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      className="icon-btn"
                      title="Subir"
                      onClick={() => void mover(b, -1)}
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      className="icon-btn"
                      title="Bajar"
                      onClick={() => void mover(b, +1)}
                    >
                      <ArrowDownIcon />
                    </button>
                    <span className="muted">({b.orden})</span>
                  </div>
                </td>

                <td>
                  <img
                    src={b.imagenUrl}
                    alt={b.titulo ?? ""}
                    style={{
                      width: 160,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </td>

                <td>{b.titulo ?? "-"}</td>

                <td className="truncate max-w-[260px]">
                  {b.linkUrl ? (
                    <a href={b.linkUrl} className="link" target="_blank">
                      {b.linkUrl}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  <button
                    className={`badge ${b.activo ? "ok" : "warn"}`}
                    onClick={() => void toggleActivo(b)}
                    title="Cambiar estado"
                  >
                    {b.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>

                <td className="text-right whitespace-nowrap">
                  {/* 👁️ Ver */}
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(b)}
                  >
                    <ViewIcon />
                  </button>
                  {/* ✏️ Editar */}
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(b)}
                  >
                    <EditIcon />
                  </button>
                  {/* 🗑️ Eliminar */}
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => void remove(b)}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center muted">
                  Sin banners
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ver */}
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
              margin: "4% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(820px, 96%)",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Detalle de banner</h3>
              <button
                className="icon-btn"
                title="Cerrar"
                onClick={() => setViewing(null)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="grid gap-2">
              <div>
                <b>ID:</b> {viewing.id}
              </div>
              <div>
                <b>Título:</b> {viewing.titulo ?? "—"}
              </div>
              <div className="truncate">
                <b>Link:</b>{" "}
                {viewing.linkUrl ? (
                  <a
                    href={viewing.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                  >
                    {viewing.linkUrl}
                  </a>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <b>Orden:</b> {viewing.orden}
              </div>
              <div>
                <b>Estado:</b> {viewing.activo ? "Activo" : "Inactivo"}
              </div>
              <div>
                <b>Publicado:</b> {new Date(viewing.publicado).toLocaleString()}
              </div>

              <div className="panel p-3 mt-2">
                <b>Preview</b>
                <img
                  src={viewing.imagenUrl}
                  alt={viewing.titulo ?? ""}
                  style={{
                    width: "100%",
                    height: 240,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginTop: 8,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer crear/editar */}
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
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "min(640px, 92vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
            }}
          >
            <h3 className="font-bold mb-3">
              {form.id ? "Editar banner" : "Nuevo banner"}
            </h3>

            <form onSubmit={submit} className="grid gap-3">
              <label className="grid gap-1">
                <span>Título (opcional)</span>
                <input
                  className="input"
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titulo: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1">
                <span>Imagen URL</span>
                <input
                  className="input"
                  value={form.imagenUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imagenUrl: e.target.value }))
                  }
                  placeholder="https://…"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span>Link (opcional)</span>
                <input
                  className="input"
                  value={form.linkUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, linkUrl: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </label>

              <div
                className="grid"
                style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Orden</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={form.orden}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, orden: e.target.value }))
                    }
                  />
                </label>

                <label className="grid gap-1">
                  <span>Activo</span>
                  <select
                    className="input"
                    value={form.activo ? "1" : "0"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, activo: e.target.value === "1" }))
                    }
                  >
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpenDrawer(false)}
                >
                  Cancelar
                </button>
                <button className="btn primary" disabled={loading}>
                  {loading ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>

            {form.imagenUrl && (
              <div className="panel p-3 mt-4">
                <b>Preview</b>
                <img
                  src={form.imagenUrl}
                  alt={form.titulo}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginTop: 8,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
