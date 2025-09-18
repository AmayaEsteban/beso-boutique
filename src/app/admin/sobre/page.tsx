"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos ===== */
type Sobre = {
  id: number;
  titulo: string;
  contenido: string; // HTML o texto
  mision: string | null;
  vision: string | null;
  valores: string | null;
  actualizado?: string; // si en un futuro agregas updatedAt con @updatedAt
};

/* ===== Icons ===== */
function PdfIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
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
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
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

/* ===== Form types ===== */
type FormState = {
  titulo: string;
  contenido: string;
  mision: string;
  vision: string;
  valores: string;
};

const toHTML = (s: string) => s; // si usas editor rich-text, aquí podrías sanear/convertir

export default function SobreNosotrosAdminPage() {
  const [rows, setRows] = useState<Sobre[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sobre | null>(null);
  const [viewing, setViewing] = useState<Sobre | null>(null);

  const [form, setForm] = useState<FormState>({
    titulo: "",
    contenido: "",
    mision: "",
    vision: "",
    valores: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sobre");
    const data = (await res.json()) as Sobre[];
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      titulo: "",
      contenido: "",
      mision: "",
      vision: "",
      valores: "",
    });
    setOpen(true);
  };
  const openEdit = (s: Sobre) => {
    setEditing(s);
    setForm({
      titulo: s.titulo,
      contenido: s.contenido,
      mision: s.mision ?? "",
      vision: s.vision ?? "",
      valores: s.valores ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      titulo: form.titulo.trim(),
      contenido: toHTML(form.contenido.trim()),
      mision: form.mision.trim() || null,
      vision: form.vision.trim() || null,
      valores: form.valores.trim() || null,
    };

    if (!payload.titulo) {
      alert("El título es requerido");
      return;
    }
    if (!payload.contenido) {
      alert("El contenido es requerido");
      return;
    }

    const url = editing ? `/api/admin/sobre/${editing.id}` : `/api/admin/sobre`;
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
    await load();
    alert(editing ? "Sección actualizada." : "Sección creada/actualizada.");
  };

  const onDelete = async (s: Sobre) => {
    if (!confirm(`Eliminar sección #${s.id}?`)) return;
    const res = await fetch(`/api/admin/sobre/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo eliminar");
      return;
    }
    await load();
    alert("Sección eliminada.");
  };

  /* ====== PDF: lista ====== */
  const exportListPDF = () => {
    const doc = new jsPDF();
    doc.text("Sobre nosotros - BESO", 14, 14);
    const body: RowInput[] = rows.map((s) => [
      s.id,
      s.titulo,
      (s.mision ?? "-").slice(0, 60),
      (s.vision ?? "-").slice(0, 60),
      (s.valores ?? "-").slice(0, 60),
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Título", "Misión", "Visión", "Valores"]],
      body,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 60 } },
    });
    doc.save("sobre_nosotros_lista.pdf");
    alert("PDF de lista generado.");
  };

  /* ====== PDF: detalle ====== */
  const exportOnePDF = (s: Sobre) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    doc.setFontSize(14);
    doc.text(`Sobre Nosotros #${s.id}`, 40, 40);

    const rowsTop: RowInput[] = [
      ["Título", s.titulo],
      ["Misión", s.mision ?? "-"],
      ["Visión", s.vision ?? "-"],
      ["Valores", s.valores ?? "-"],
    ];
    autoTable(doc, {
      startY: 56,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rowsTop,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 420 } },
    });

    const y =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 120;

    autoTable(doc, {
      startY: y + 16,
      theme: "grid",
      head: [["Contenido"]],
      body: [[s.contenido.replace(/<[^>]+>/g, "").slice(0, 2000)]],
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 520 } },
    });

    doc.save(`sobre_nosotros_${s.id}.pdf`);
    alert("PDF del detalle generado.");
  };

  /* ====== Tabla/paginación chiquita (normalmente 1 registro) ====== */
  const pageRows = useMemo(() => rows, [rows]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Sobre nosotros</h1>

      <div className="panel p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="muted">Total: {rows.length}</div>
          <button
            className="icon-btn"
            onClick={exportListPDF}
            title="Exportar PDF"
          >
            <PdfIcon />
          </button>
          <button className="btn primary" onClick={openCreate}>
            <PlusIcon style={{ marginRight: 8 }} />
            {rows.length ? "Nuevo registro" : "Crear sección"}
          </button>
        </div>
      </div>

      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Título</th>
              <th>Misión</th>
              <th>Visión</th>
              <th>Valores</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.titulo}</td>
                <td>{s.mision ?? "-"}</td>
                <td>{s.vision ?? "-"}</td>
                <td>{s.valores ?? "-"}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver"
                    onClick={() => setViewing(s)}
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => openEdit(s)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Eliminar"
                    onClick={() => void onDelete(s)}
                  >
                    <TrashIcon />
                  </button>
                  <button
                    className="icon-btn"
                    title="PDF"
                    onClick={() => exportOnePDF(s)}
                  >
                    <PdfIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted text-center p-4">
                  Sin registros. Crea la sección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--panel)",
              color: "var(--ink)",
              margin: "3% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(820px, 96%)",
              maxHeight: "92vh",
              overflow: "auto",
              display: "grid",
              gap: 12,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Vista previa</h3>
              <button
                className="icon-btn"
                title="Cerrar"
                onClick={() => setViewing(null)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="panel p-3 grid gap-2" style={{ lineHeight: 1.7 }}>
              <div>
                <b>Título:</b> {viewing.titulo}
              </div>
              <div>
                <b>Misión:</b> {viewing.mision ?? "-"}
              </div>
              <div>
                <b>Visión:</b> {viewing.vision ?? "-"}
              </div>
              <div>
                <b>Valores:</b> {viewing.valores ?? "-"}
              </div>
              <hr style={{ opacity: 0.2 }} />
              <div>
                <b>Contenido:</b>
                <div
                  className="mt-2"
                  dangerouslySetInnerHTML={{ __html: viewing.contenido }}
                />
              </div>
            </div>
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
            role="document"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "min(760px, 94vw)",
              background: "var(--panel)",
              color: "var(--ink)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              display: "grid",
              gridTemplateRows: "auto 1fr",
              overflow: "auto",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">
                {editing ? "Editar sección" : "Nueva sección"}
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
                <span>Título</span>
                <input
                  className="input"
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titulo: e.target.value }))
                  }
                  required
                />
              </label>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Misión (opcional)</span>
                  <input
                    className="input"
                    value={form.mision}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mision: e.target.value }))
                    }
                  />
                </label>
                <label className="grid gap-1">
                  <span>Visión (opcional)</span>
                  <input
                    className="input"
                    value={form.vision}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vision: e.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span>Valores (opcional)</span>
                <input
                  className="input"
                  value={form.valores}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, valores: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1">
                <span>Contenido (HTML o texto)</span>
                <textarea
                  className="input"
                  rows={14}
                  value={form.contenido}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contenido: e.target.value }))
                  }
                  placeholder="<p>Quiénes somos…</p>"
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
                  {editing ? "Guardar cambios" : "Crear sección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
