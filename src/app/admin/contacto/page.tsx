"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Iconos (coherentes) ===== */
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
function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M5 4h10l4 4v12H5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M7 4v6h10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ResetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 3-6.708"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3 3v6h6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/* ===== Tipos ===== */
type Contacto = {
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  direccion: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  horario: string | null;
  mapaEmbed: string | null;
};

const emptyContacto: Contacto = {
  telefono: null,
  whatsapp: null,
  email: null,
  direccion: null,
  facebook: null,
  instagram: null,
  tiktok: null,
  horario: null,
  mapaEmbed: null,
};

export default function AdminContactoPage() {
  const [data, setData] = useState<Contacto>(emptyContacto);
  const [loading, setLoading] = useState(false);

  const fetchContacto = async () => {
    const res = await fetch("/api/admin/contacto");
    const json = (await res.json()) as Partial<Contacto> | undefined;
    setData({ ...emptyContacto, ...(json ?? {}) });
  };

  useEffect(() => {
    void fetchContacto();
  }, []);

  const onChange =
    (key: keyof Contacto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setData((d) => ({ ...d, [key]: e.target.value }));
    };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/contacto", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo guardar");
      return;
    }
    alert("Contacto actualizado.");
    void fetchContacto();
  };

  const onReset = () => void fetchContacto();

  /* ===== Vista para PDF ===== */
  const lines: RowInput[] = useMemo(() => {
    const items: Array<[string, string]> = [
      ["Teléfono", data.telefono ?? "-"],
      ["WhatsApp", data.whatsapp ?? "-"],
      ["Email", data.email ?? "-"],
      ["Dirección", data.direccion ?? "-"],
      ["Facebook", data.facebook ?? "-"],
      ["Instagram", data.instagram ?? "-"],
      ["TikTok", data.tiktok ?? "-"],
      ["Horario", data.horario ?? "-"],
    ];
    return items.map(([k, v]) => [k, v]);
  }, [data]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Contacto - BESO", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["Campo", "Valor"]],
      body: lines,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      theme: "grid",
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 135 } },
    });
    // Si hay mapa, añadimos una página con el iframe como texto (referencia)
    if (data.mapaEmbed) {
      doc.addPage();
      doc.text("Mapa (embed HTML):", 14, 20);
      const chunk = data.mapaEmbed.slice(0, 600); // para no desbordar
      doc.text(chunk, 14, 30, { maxWidth: 180 });
    }
    doc.save("contacto_beso.pdf");
    alert("PDF de contacto generado.");
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Contacto</h1>

      <div
        className="grid"
        style={{ gap: 16, gridTemplateColumns: "1.1fr .9fr" }}
      >
        {/* === Formulario de edición === */}
        <form className="panel p-4 grid gap-3" onSubmit={onSave}>
          <div
            className="grid"
            style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
          >
            <label className="grid gap-1">
              <span>Teléfono</span>
              <input
                className="input"
                value={data.telefono ?? ""}
                onChange={onChange("telefono")}
                placeholder="+502 5555-5555"
              />
            </label>
            <label className="grid gap-1">
              <span>WhatsApp</span>
              <input
                className="input"
                value={data.whatsapp ?? ""}
                onChange={onChange("whatsapp")}
                placeholder="50255555555"
              />
            </label>
            <label className="grid gap-1">
              <span>Email</span>
              <input
                className="input"
                type="email"
                value={data.email ?? ""}
                onChange={onChange("email")}
                placeholder="soporte@beso.com"
              />
            </label>
            <label className="grid gap-1">
              <span>Horario</span>
              <input
                className="input"
                value={data.horario ?? ""}
                onChange={onChange("horario")}
                placeholder="L–V 9:00–18:00 · S 9:00–13:00"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span>Dirección</span>
            <input
              className="input"
              value={data.direccion ?? ""}
              onChange={onChange("direccion")}
              placeholder="Zona 14, Ciudad de Guatemala"
            />
          </label>

          <div
            className="grid"
            style={{ gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}
          >
            <label className="grid gap-1">
              <span>Facebook</span>
              <input
                className="input"
                value={data.facebook ?? ""}
                onChange={onChange("facebook")}
                placeholder="https://facebook.com/beso.boutique"
              />
            </label>
            <label className="grid gap-1">
              <span>Instagram</span>
              <input
                className="input"
                value={data.instagram ?? ""}
                onChange={onChange("instagram")}
                placeholder="https://instagram.com/beso.boutique"
              />
            </label>
            <label className="grid gap-1">
              <span>TikTok</span>
              <input
                className="input"
                value={data.tiktok ?? ""}
                onChange={onChange("tiktok")}
                placeholder="https://tiktok.com/@beso.boutique"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span>Mapa (iframe embed)</span>
            <textarea
              className="input"
              rows={4}
              value={data.mapaEmbed ?? ""}
              onChange={onChange("mapaEmbed")}
              placeholder={`<iframe ... >...</iframe>`}
            />
          </label>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              className="btn"
              onClick={onReset}
              title="Recargar"
            >
              <ResetIcon style={{ marginRight: 8 }} />
              Restablecer
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              <SaveIcon style={{ marginRight: 8 }} />
              {loading ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>

        {/* === Vista previa + Exportar PDF === */}
        <aside className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Vista previa</h3>
            <button
              className="icon-btn"
              onClick={exportPDF}
              title="Exportar PDF"
            >
              <PdfIcon />
            </button>
          </div>

          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
            }}
          >
            <article className="panel p-4">
              <h4 className="font-bold mb-1">Teléfono</h4>
              <p>{data.telefono ?? "-"}</p>
              <p className="muted text-sm">{data.horario ?? "—"}</p>
            </article>
            <article className="panel p-4">
              <h4 className="font-bold mb-1">WhatsApp</h4>
              <p>{data.whatsapp ?? "-"}</p>
              {data.whatsapp && (
                <p className="mt-2">
                  <a
                    className="btn ghost"
                    href={`https://wa.me/${encodeURIComponent(
                      data.whatsapp
                    )}?text=Hola%20BESO`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir chat
                  </a>
                </p>
              )}
            </article>
            <article className="panel p-4">
              <h4 className="font-bold mb-1">Correo</h4>
              <p>{data.email ?? "-"}</p>
            </article>
            <article className="panel p-4">
              <h4 className="font-bold mb-1">Redes</h4>
              <ul className="grid gap-2">
                <li>
                  {data.instagram ? (
                    <a className="link" href={data.instagram} target="_blank">
                      Instagram
                    </a>
                  ) : (
                    <span className="muted">Instagram —</span>
                  )}
                </li>
                <li>
                  {data.facebook ? (
                    <a className="link" href={data.facebook} target="_blank">
                      Facebook
                    </a>
                  ) : (
                    <span className="muted">Facebook —</span>
                  )}
                </li>
                <li>
                  {data.tiktok ? (
                    <a className="link" href={data.tiktok} target="_blank">
                      TikTok
                    </a>
                  ) : (
                    <span className="muted">TikTok —</span>
                  )}
                </li>
              </ul>
            </article>
          </div>

          <div className="panel p-0 overflow-hidden mt-4">
            {data.mapaEmbed ? (
              <div dangerouslySetInnerHTML={{ __html: data.mapaEmbed }} />
            ) : (
              <div className="p-4 muted">Sin mapa (iframe) configurado.</div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
