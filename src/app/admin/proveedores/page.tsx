"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Icons (mismos del módulo de usuarios) ===== */
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

/* ===== Tipos estrictos ===== */
type Proveedor = {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  _count?: { compras: number; devoluciones: number };
};
type FormState = {
  nombre: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
};

const sanitizePhone = (s: string) => s.replace(/[^0-9+()\s-]/g, "");
const sanitizeEmail = (s: string) => s.trim();

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros/paginación
  const [q, setQ] = useState("");
  const [idOrder, setIdOrder] = useState<"" | "asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // drawer/form
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    contacto: "",
    telefono: "",
    correo: "",
    direccion: "",
  });

  // detalle
  const [viewing, setViewing] = useState<Proveedor | null>(null);

  const fetchProveedores = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (idOrder) {
      sp.set("order", "id");
      sp.set("dir", idOrder);
    }
    const res = await fetch(`/api/admin/proveedores?${sp.toString()}`);
    const data = (await res.json()) as Proveedor[];
    setProveedores(data);
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    // carga inicial
    void fetchProveedores();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: "",
      contacto: "",
      telefono: "",
      correo: "",
      direccion: "",
    });
    setOpen(true);
  };
  const openEdit = (p: Proveedor) => {
    setEditing(p);
    setForm({
      nombre: p.nombre ?? "",
      contacto: p.contacto ?? "",
      telefono: p.telefono ?? "",
      correo: p.correo ?? "",
      direccion: p.direccion ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nombre: form.nombre.trim(),
      contacto: form.contacto.trim() || null,
      telefono: form.telefono ? sanitizePhone(form.telefono) : null,
      correo: form.correo ? sanitizeEmail(form.correo) : null,
      direccion: form.direccion.trim() || null,
    };

    if (!payload.nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    const url = editing
      ? `/api/admin/proveedores/${editing.id}`
      : `/api/admin/proveedores`;
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
    await fetchProveedores();
    alert(editing ? "Proveedor actualizado." : "Proveedor creado.");
  };

  const onDelete = async (p: Proveedor) => {
    if (!confirm(`Eliminar proveedor: ${p.nombre}?`)) return;
    const res = await fetch(`/api/admin/proveedores/${p.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await fetchProveedores();
    alert("Proveedor eliminado.");
  };

  // export PDF (lista)
  const exportPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = proveedores.map((p) => [
      p.id,
      p.nombre,
      p.contacto ?? "-",
      p.telefono ?? "-",
      p.correo ?? "-",
      (p._count?.compras ?? 0).toString(),
      (p._count?.devoluciones ?? 0).toString(),
    ]);
    doc.text("Proveedores - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [
        [
          "ID",
          "Nombre",
          "Contacto",
          "Teléfono",
          "Correo",
          "Compras",
          "Devoluciones",
        ],
      ],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("proveedores.pdf");
    alert("PDF de proveedores generado.");
  };

  // export PDF (detalle)
  const exportProveedorPDF = (p: Proveedor) => {
    const doc = new jsPDF();
    const rows: RowInput[] = [
      ["ID", String(p.id)],
      ["Nombre", p.nombre],
      ["Contacto", p.contacto ?? "-"],
      ["Teléfono", p.telefono ?? "-"],
      ["Correo", p.correo ?? "-"],
      ["Dirección", p.direccion ?? "-"],
      ["Compras registradas", String(p._count?.compras ?? 0)],
      ["Devoluciones registradas", String(p._count?.devoluciones ?? 0)],
    ];
    doc.text(`Proveedor #${p.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
    });
    doc.save(`proveedor_${p.id}.pdf`);
    alert(`PDF del proveedor #${p.id} generado.`);
  };

  // paginación
  const count = proveedores.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, count);

  const pageRows = useMemo(
    () => proveedores.slice(startIndex, endIndex),
    [proveedores, startIndex, endIndex]
  );

  // si cambia pageSize -> página 1
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Proveedores</h1>

      {/* Barra superior */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="input"
            placeholder="Buscar por nombre, contacto, teléfono o correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <select
            className="input"
            value={idOrder}
            onChange={(e) => setIdOrder(e.target.value as "" | "asc" | "desc")}
            title="Orden por ID"
            style={{ width: 160 }}
          >
            <option value="">Ordenar por ID…</option>
            <option value="asc">ID ascendente</option>
            <option value="desc">ID descendente</option>
          </select>
          <button className="btn" onClick={fetchProveedores} disabled={loading}>
            Filtrar
          </button>

          <div className="muted ml-auto">Total: {count}</div>

          <button className="icon-btn" onClick={exportPDF} title="Exportar PDF">
            <PdfIcon />
          </button>
          <button className="btn primary" onClick={openCreate}>
            <PlusIcon style={{ marginRight: 8 }} />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th style={{ width: 120, textAlign: "right" }}>Mov.</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nombre}</td>
                <td>{p.contacto ?? "-"}</td>
                <td>{p.telefono ?? "-"}</td>
                <td>{p.correo ?? "-"}</td>
                <td style={{ textAlign: "right" }}>
                  C: {p._count?.compras ?? 0} · D: {p._count?.devoluciones ?? 0}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    className="icon-btn"
                    title="Ver detalle"
                    onClick={() => setViewing(p)}
                  >
                    <ViewIcon />
                  </button>
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
                    onClick={() => onDelete(p)}
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
              <h3 className="font-bold">Detalle de proveedor</h3>
              <div className="flex gap-2">
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportProveedorPDF(viewing)}
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
              <b>Nombre:</b> {viewing.nombre}
            </p>
            <p>
              <b>Contacto:</b> {viewing.contacto ?? "-"}
            </p>
            <p>
              <b>Teléfono:</b> {viewing.telefono ?? "-"}
            </p>
            <p>
              <b>Correo:</b> {viewing.correo ?? "-"}
            </p>
            <p>
              <b>Dirección:</b> {viewing.direccion ?? "-"}
            </p>
            <p>
              <b>Compras:</b> {viewing._count?.compras ?? 0}
            </p>
            <p>
              <b>Devoluciones:</b> {viewing._count?.devoluciones ?? 0}
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
          aria-label={editing ? "Editar proveedor" : "Nuevo proveedor"}
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
                {editing ? "Editar proveedor" : "Nuevo proveedor"}
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
              <label className="grid gap-1">
                <span>Persona de contacto</span>
                <input
                  className="input"
                  value={form.contacto}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contacto: e.target.value }))
                  }
                />
              </label>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Teléfono</span>
                  <input
                    className="input"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        telefono: sanitizePhone(e.target.value),
                      }))
                    }
                    inputMode="tel"
                    placeholder="+502 5555-5555"
                  />
                </label>
                <label className="grid gap-1">
                  <span>Correo</span>
                  <input
                    className="input"
                    type="email"
                    value={form.correo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, correo: e.target.value }))
                    }
                    placeholder="contacto@proveedor.com"
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span>Dirección</span>
                <input
                  className="input"
                  value={form.direccion}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, direccion: e.target.value }))
                  }
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
                  {editing ? "Guardar cambios" : "Crear proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
