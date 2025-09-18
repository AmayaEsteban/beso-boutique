"use client";

import React, { useState } from "react";

export default function ContactForm() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);
    setSending(true);

    const res = await fetch("/api/contacto/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        asunto: form.asunto.trim() || null,
        mensaje: form.mensaje.trim(),
      }),
    });

    setSending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setErrMsg(err?.error ?? "No se pudo enviar tu mensaje.");
      return;
    }
    setOkMsg("¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.");
    setForm({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
  };

  return (
    <div className="panel p-5">
      <button className="btn primary" onClick={() => setOpen((v) => !v)}>
        {open ? "Ocultar formulario" : "Enviar un mensaje"}
      </button>

      {open && (
        <form className="grid gap-3 mt-4" onSubmit={onSubmit}>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <label className="grid gap-1">
              <span>Nombre *</span>
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
              <span>Email *</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                required
              />
            </label>
          </div>

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
                  setForm((f) => ({ ...f, telefono: e.target.value }))
                }
                placeholder="+502 5555-5555"
              />
            </label>
            <label className="grid gap-1">
              <span>Asunto</span>
              <input
                className="input"
                value={form.asunto}
                onChange={(e) =>
                  setForm((f) => ({ ...f, asunto: e.target.value }))
                }
                placeholder="Consulta, pedido, cambio…"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span>Mensaje *</span>
            <textarea
              className="input"
              rows={5}
              value={form.mensaje}
              onChange={(e) =>
                setForm((f) => ({ ...f, mensaje: e.target.value }))
              }
              required
            />
          </label>

          <div className="flex items-center gap-3">
            <button className="btn primary" type="submit" disabled={sending}>
              {sending ? "Enviando…" : "Enviar"}
            </button>
            {okMsg && <span className="text-green-600">{okMsg}</span>}
            {errMsg && <span className="text-red-600">{errMsg}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
