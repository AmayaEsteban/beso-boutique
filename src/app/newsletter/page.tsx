"use client";

import { useState } from "react";

const isEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim().toLowerCase());

export default function NewsletterPage() {
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
    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: eMail }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus("ok");
      setMsg("¡Listo! Te suscribimos a nuestro boletín.");
      setEmail("");
    } else {
      setStatus("error");
      setMsg(data?.error ?? "No se pudo suscribir.");
    }
  };

  return (
    <section
      className="container"
      style={{ maxWidth: 680, padding: "2rem 1rem" }}
    >
      <header className="mb-4" style={{ textAlign: "center" }}>
        <h1 className="text-3xl font-bold">Suscríbete al Newsletter</h1>
        <p className="muted mt-2">Recibe novedades, lanzamientos y ofertas.</p>
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
        <button type="submit" className="btn primary">
          Suscribirme
        </button>
        {status !== "idle" && (
          <div className={status === "ok" ? "text-green-600" : "text-red-600"}>
            {msg}
          </div>
        )}
      </form>

      <p className="muted text-sm mt-3" style={{ textAlign: "center" }}>
        ¿No quieres recibir más correos?{" "}
        <a className="link" href="/newsletter/unsubscribe">
          Dar de baja
        </a>
        .
      </p>
    </section>
  );
}
