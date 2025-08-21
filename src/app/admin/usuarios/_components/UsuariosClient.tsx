"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Prisma, Rol, UsuariosEstado } from "@prisma/client";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

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
function ToggleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <rect
        x="3"
        y="8"
        width="18"
        height="8"
        rx="4"
        ry="4"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.6"
      />
      <circle cx="9" cy="12" r="3" fill="currentColor" />
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

/* ===== Tipos ===== */
type UsuarioExtra = {
  apellidos: string | null;
  dpi: string | null;
  nit: string | null;
  direccion: string | null;
};
type UsuarioWithRol = Prisma.UsuarioGetPayload<{ include: { rol: true } }> &
  UsuarioExtra;
type Props = { roles: Rol[] };

type FormState = {
  nombre: string;
  apellidos: string;
  email: string;
  idRol: string;
  estado: UsuariosEstado;
  password?: string;
  dpi: string;
  nit: string;
  direccion: string;
};
type UpsertPayload = {
  nombre: string;
  apellidos?: string | null;
  email: string;
  idRol: number;
  estado: UsuariosEstado;
  password?: string;
  dpi?: string | null;
  nit?: string | null;
  direccion?: string | null;
};

/* ===== Helpers de validación/sanitización ===== */
const onlyLetters = (s: string) =>
  s.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s.'-]/g, ""); // permite letras, espacios, punto, apóstrofe, guion
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const digitsDash = (s: string) => s.replace(/[^0-9-]/g, "");

export default function UsuariosClient({ roles }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioWithRol[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [rol, setRol] = useState<string>("");
  const [estado, setEstado] = useState<"all" | UsuariosEstado>("all");
  const [idOrder, setIdOrder] = useState<"" | "asc" | "desc">("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // drawer derecha
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<UsuarioWithRol | null>(null);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    apellidos: "",
    email: "",
    idRol: "",
    estado: "activo",
    password: "",
    dpi: "",
    nit: "",
    direccion: "",
  });

  // modal de detalle
  const [viewing, setViewing] = useState<UsuarioWithRol | null>(null);

  const router = useRouter();

  const fetchUsuarios = async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (rol) sp.set("rol", rol);
    if (estado) sp.set("estado", estado);
    if (idOrder) {
      sp.set("order", "id");
      sp.set("dir", idOrder);
    } else {
      sp.set("order", "fecha_registro");
      sp.set("dir", "desc");
    }
    const res = await fetch(`/api/admin/usuarios?${sp.toString()}`);
    const data = (await res.json()) as UsuarioWithRol[];
    setUsuarios(data);
    setLoading(false);
    setPage(1); // reset al filtrar
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: "",
      apellidos: "",
      email: "",
      idRol: "",
      estado: "activo",
      password: "",
      dpi: "",
      nit: "",
      direccion: "",
    });
    setOpenModal(true);
  };

  const openEdit = (u: UsuarioWithRol) => {
    setEditing(u);
    setForm({
      nombre: u.nombre ?? "",
      apellidos: u.apellidos ?? "",
      email: u.email ?? "",
      idRol: String(u.idRol),
      estado: (u.estado ?? "activo") as UsuariosEstado,
      password: "",
      dpi: u.dpi ?? "",
      nit: u.nit ?? "",
      direccion: u.direccion ?? "",
    });
    setOpenModal(true);
  };

  // Guardar (crear/editar)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // normalizamos y validamos antes de enviar
    const nombre = onlyLetters(form.nombre).trim();
    const apellidos = onlyLetters(form.apellidos).trim();
    const dpiClean = onlyDigits(form.dpi);
    const nitClean = digitsDash(form.nit);
    const nitDigits = onlyDigits(nitClean);

    if (!nombre) {
      alert("El nombre no puede estar vacío ni contener números.");
      return;
    }
    // Apellidos opcional, pero si viene, sin números
    if (form.apellidos && !apellidos) {
      alert("Los apellidos no pueden contener números.");
      return;
    }
    if (dpiClean && dpiClean.length !== 13) {
      alert("El DPI debe contener exactamente 13 dígitos.");
      return;
    }
    if (nitDigits && (nitDigits.length < 6 || nitDigits.length > 12)) {
      alert("El NIT debe tener entre 6 y 12 dígitos (sin contar guiones).");
      return;
    }

    const payload: UpsertPayload = {
      nombre,
      apellidos: apellidos ? apellidos : null,
      email: form.email,
      idRol: Number(form.idRol),
      estado: form.estado,
      dpi: dpiClean ? dpiClean : null,
      nit: nitClean ? nitClean : null,
      direccion: form.direccion ? form.direccion.trim() : null,
    };

    if (!editing && !form.password) {
      alert("Password es requerido para crear.");
      return;
    }
    if (form.password) payload.password = form.password;

    const url = editing
      ? `/api/admin/usuarios/${editing.id}`
      : `/api/admin/usuarios`;
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

    setOpenModal(false);
    await fetchUsuarios();
    alert(
      editing
        ? "Usuario actualizado correctamente."
        : "Usuario creado correctamente."
    );
  };

  const onDelete = async (u: UsuarioWithRol) => {
    if (!confirm(`Eliminar usuario: ${u.nombre}?`)) return;
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al eliminar");
      return;
    }
    await fetchUsuarios();
    alert("Usuario eliminado.");
  };

  const onToggleEstado = async (u: UsuarioWithRol) => {
    const nuevo: UsuariosEstado = u.estado === "activo" ? "inactivo" : "activo";
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al cambiar estado");
      return;
    }
    await fetchUsuarios();
    alert(`Estado cambiado a ${nuevo}.`);
  };

  // Exportar PDF (lista)
  const exportPDF = () => {
    const doc = new jsPDF();
    const body: RowInput[] = usuarios.map((u) => [
      u.id,
      u.nombre,
      u.email,
      u.rol?.nombre ?? "-",
      String(u.estado),
      format(new Date(u.fecha_registro), "yyyy-MM-dd HH:mm"),
    ]);
    doc.text("Usuarios - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nombre", "Email", "Rol", "Estado", "Fecha"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("usuarios.pdf");
    alert("PDF de lista generado.");
  };

  // Exportar PDF individual
  const exportUserPDF = (u: UsuarioWithRol) => {
    const doc = new jsPDF();
    const rows: RowInput[] = [
      ["ID", String(u.id)],
      ["Nombre", u.nombre ?? "-"],
      ["Apellidos", u.apellidos ?? "-"],
      ["Email", u.email ?? "-"],
      ["Rol", u.rol?.nombre ?? "-"],
      ["Estado", String(u.estado ?? "-")],
      [
        "Fecha registro",
        format(new Date(u.fecha_registro), "yyyy-MM-dd HH:mm"),
      ],
      ["DPI", u.dpi ?? "-"],
      ["NIT", u.nit ?? "-"],
      ["Dirección", u.direccion ?? "-"],
    ];
    doc.text(`Usuario #${u.id}`, 14, 14);
    autoTable(doc, {
      startY: 26,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });
    doc.save(`usuario_${u.id}.pdf`);
    alert(`PDF del usuario #${u.id} generado.`);
  };

  // datos de paginación
  const count = usuarios.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, count);

  const pagedUsuarios = useMemo(
    () => usuarios.slice(startIndex, endIndex),
    [usuarios, startIndex, endIndex]
  );

  // si cambia pageSize, ir a la página 1
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const handleCancel = () => {
    setOpenModal(false);
    router.replace("/admin/usuarios");
  };

  return (
    <>
      {/* Barra superior con filtros plegables */}
      <div className="panel p-4 mb-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="muted">Total: {count}</div>

          {/* Paginación compacta */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              {count === 0 ? 0 : startIndex + 1}-{endIndex} de {count}
            </span>
          </div>

          <button
            className="btn ghost"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {filtersOpen && (
          <div
            style={{
              display: "flex",
              gap: ".5rem",
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            <input
              className="input"
              placeholder="Buscar por nombre, apellidos o email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="input"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="">Rol (todos)</option>
              {roles.map((r) => (
                <option key={r.idRol} value={String(r.idRol)}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as UsuariosEstado | "all")
              }
            >
              <option value="all">Estado (todos)</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <select
              className="input"
              value={idOrder}
              onChange={(e) =>
                setIdOrder(e.target.value as "" | "asc" | "desc")
              }
              title="Ordenar por ID"
            >
              <option value="">Ordenar por ID…</option>
              <option value="asc">ID ascendente</option>
              <option value="desc">ID descendente</option>
            </select>
            <button className="btn" onClick={fetchUsuarios} disabled={loading}>
              Filtrar
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button className="icon-btn" onClick={exportPDF} title="Exportar PDF">
            <PdfIcon />
          </button>
          <button className="btn primary" onClick={openCreate}>
            <PlusIcon style={{ marginRight: 8 }} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombres</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pagedUsuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.rol?.nombre ?? "-"}</td>
                <td>
                  <span
                    className={`badge ${u.estado === "activo" ? "ok" : ""}`}
                  >
                    {u.estado}
                  </span>
                </td>
                <td>
                  {format(new Date(u.fecha_registro), "yyyy-MM-dd HH:mm")}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    className="icon-btn"
                    onClick={() => setViewing(u)}
                    title="Ver información"
                  >
                    <ViewIcon />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => openEdit(u)}
                    title="Editar"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => onToggleEstado(u)}
                    title={u.estado === "activo" ? "Desactivar" : "Activar"}
                  >
                    <ToggleIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => onDelete(u)}
                    title="Eliminar"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pagedUsuarios.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación inferiores */}
      <div
        className="panel p-3"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div className="muted">
          Mostrando {count === 0 ? 0 : startIndex + 1}-{endIndex} de {count}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            « Anterior
          </button>
          <div className="muted" style={{ padding: "6px 10px" }}>
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
            style={{
              background: "var(--panel)",
              color: "var(--ink)",
              margin: "5% auto",
              padding: "20px",
              borderRadius: 8,
              width: "min(520px, 92%)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h3 style={{ fontWeight: 700 }}>Detalle de usuario</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="icon-btn"
                  title="Exportar PDF"
                  onClick={() => exportUserPDF(viewing)}
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
              <b>Nombres:</b> {viewing.nombre}
            </p>
            <p>
              <b>Apellidos:</b> {viewing.apellidos ?? "-"}
            </p>
            <p>
              <b>Email:</b> {viewing.email}
            </p>
            <p>
              <b>Rol:</b> {viewing.rol?.nombre ?? "-"}
            </p>
            <p>
              <b>Estado:</b> {viewing.estado}
            </p>
            <p>
              <b>Fecha registro:</b>{" "}
              {format(new Date(viewing.fecha_registro), "yyyy-MM-dd HH:mm")}
            </p>
            <p>
              <b>DPI:</b> {viewing.dpi ?? "-"}
            </p>
            <p>
              <b>NIT:</b> {viewing.nit ?? "-"}
            </p>
            <p>
              <b>Dirección:</b> {viewing.direccion ?? "-"}
            </p>
          </div>
        </div>
      )}

      {/* Drawer derecha (crear/editar) */}
      {openModal && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Editar usuario" : "Nuevo usuario"}
          style={{ position: "fixed", inset: 0, zIndex: 1000 }}
          onClick={handleCancel}
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
              padding: "16px",
              display: "grid",
              gridTemplateRows: "auto 1fr",
              boxShadow: "0 10px 40px rgba(0,0,0,.35)",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {editing ? "Editar usuario" : "Nuevo usuario"}
              </h3>
              <button
                className="icon-btn"
                onClick={handleCancel}
                title="Cerrar"
                aria-label="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3">
              <label className="grid gap-1">
                <span>Nombres</span>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => {
                    const v = onlyLetters(e.target.value);
                    setForm((f) => ({ ...f, nombre: v }));
                  }}
                  required
                />
              </label>

              <label className="grid gap-1">
                <span>Apellidos</span>
                <input
                  className="input"
                  value={form.apellidos}
                  onChange={(e) => {
                    const v = onlyLetters(e.target.value);
                    setForm((f) => ({ ...f, apellidos: v }));
                  }}
                />
              </label>

              <label className="grid gap-1">
                <span>Correo</span>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="grid gap-1">
                <span>Rol</span>
                <select
                  className="input"
                  value={form.idRol}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, idRol: e.target.value }))
                  }
                  required
                >
                  <option value="">Seleccione un rol…</option>
                  {roles.map((r) => (
                    <option key={r.idRol} value={String(r.idRol)}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span>Estado</span>
                <select
                  className="input"
                  value={form.estado}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      estado: e.target.value as UsuariosEstado,
                    }))
                  }
                  required
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>

              {/* Datos extra */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>DPI</span>
                  <input
                    className="input"
                    value={form.dpi}
                    onChange={(e) => {
                      const v = onlyDigits(e.target.value).slice(0, 13);
                      setForm((f) => ({ ...f, dpi: v }));
                    }}
                    inputMode="numeric"
                    maxLength={13}
                    placeholder="13 dígitos"
                  />
                </label>
                <label className="grid gap-1">
                  <span>NIT</span>
                  <input
                    className="input"
                    value={form.nit}
                    onChange={(e) => {
                      const v = digitsDash(e.target.value).slice(0, 14);
                      setForm((f) => ({ ...f, nit: v }));
                    }}
                    inputMode="numeric"
                    placeholder="Ej. 1234567-8"
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
                  placeholder="Calle/Avenida, número, zona…"
                />
              </label>

              {!editing && (
                <label className="grid gap-1">
                  <span>Contraseña</span>
                  <input
                    className="input"
                    type="password"
                    value={form.password ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    required
                  />
                </label>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  className="btn ghost"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  {editing ? "Guardar cambios" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
