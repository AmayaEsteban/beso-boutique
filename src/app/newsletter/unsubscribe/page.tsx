"use client";

import { useState } from "react";

const isEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim().toLowerCase());

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMail = email.trim().toLowerCase();
    if (!isEmail(eMail)) {
      setStatus("error");
      setMsg("Ingresa un correo válido.");
      return;
    }
    const res = await fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: eMail }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus("ok");
      setMsg("Baja realizada. Lamentamos verte partir 🥹");
      setEmail("");
    } else {
      setStatus("error");
      setMsg(data?.error ?? "No se pudo procesar la baja.");
    }
  };

  return (
    <section
      className="container"
      style={{ maxWidth: 680, padding: "2rem 1rem" }}
    >
      <header className="mb-4" style={{ textAlign: "center" }}>
        <h1 className="text-3xl font-bold">Cancelar suscripción</h1>
        <p className="muted mt-2">
          Deja de recibir nuestro newsletter cuando quieras.
        </p>
      </header>

      <form onSubmit={submit} className="panel p-5 grid gap-3">
        <label className="grid gap-1">
          <span>Correo electrónico</span>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </label>
        <button type="submit" className="btn danger">
          Dar de baja
        </button>
        {status !== "idle" && (
          <div className={status === "ok" ? "text-green-600" : "text-red-600"}>
            {msg}
          </div>
        )}
      </form>
    </section>
  );
}
