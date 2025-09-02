"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

type FormState = {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  confirm: string;
};

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombre = form.nombre.trim();
    const apellidos = form.apellidos.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!nombre) {
      alert("El nombre es requerido");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Email inválido");
      return;
    }
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== form.confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellidos, email, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "No se pudo registrar");
      return;
    }

    // === Opción A: Auto-login y redirección (recomendado) ===
    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (login?.ok) {
      router.push("/"); // o "/admin" si prefieres
      return;
    }
    // Si por alguna razón no inició sesión, manda a login
    router.push("/login");

    // === Opción B: Sin auto-login (deja esto si prefieres) ===
    // alert("Registro exitoso. Inicia sesión.");
    // router.push("/login");
  };

  return (
    <div className="container" style={{ maxWidth: 520, padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Crear cuenta</h1>

      <form onSubmit={onSubmit} className="panel" style={{ padding: "1rem" }}>
        <div
          className="grid"
          style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
        >
          <label className="grid gap-1">
            <span>Nombres</span>
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
            <span>Apellidos</span>
            <input
              className="input"
              value={form.apellidos}
              onChange={(e) =>
                setForm((f) => ({ ...f, apellidos: e.target.value }))
              }
            />
          </label>
        </div>

        <label className="grid gap-1" style={{ marginTop: 12 }}>
          <span>Correo</span>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="tucorreo@beso.com"
            required
          />
        </label>

        <div
          className="grid"
          style={{ gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}
        >
          <label className="grid gap-1">
            <span>Contraseña</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="Mínimo 6 caracteres"
              required
            />
          </label>
          <label className="grid gap-1">
            <span>Confirmar</span>
            <input
              className="input"
              type="password"
              value={form.confirm}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirm: e.target.value }))
              }
              required
            />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--primary" disabled={loading}>
              {loading ? "Creando…" : "Crear cuenta"}
            </button>
            <button
              type="reset"
              className="btn btn--neutral"
              onClick={() =>
                setForm({
                  nombre: "",
                  apellidos: "",
                  email: "",
                  password: "",
                  confirm: "",
                })
              }
            >
              Limpiar
            </button>
          </div>

          <div className="muted" style={{ marginTop: 8 }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="link">
              Inicia sesión
            </Link>
          </div>
        </div>
      </form>

      <p className="muted" style={{ marginTop: 12, fontSize: ".9rem" }}>
        * Los datos de teléfono, DPI y dirección se completarán durante la
        compra. Tu cuenta ya quedará creada con rol <b>CLIENTE</b>.
      </p>
    </div>
  );
}
