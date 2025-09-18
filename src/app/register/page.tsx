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

    if (!nombre) return alert("El nombre es requerido");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return alert("Email inválido");
    if (password.length < 6)
      return alert("La contraseña debe tener al menos 6 caracteres");
    if (password !== form.confirm) return alert("Las contraseñas no coinciden");

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

    // Auto-login y redirección
    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (login?.ok) {
      router.push("/");
      return;
    }
    router.push("/login");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1rem",
      }}
    >
      <section
        className="panel"
        style={{
          width: "min(980px, 96vw)",
          display: "grid",
          gridTemplateColumns: "1fr",
          overflow: "hidden",
          borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,.18)",
        }}
      >
        {/* Lado visual */}
        <div
          style={{
            background: "var(--soft)",
            padding: "3rem 2rem",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                overflow: "hidden",
                margin: "0 auto 1rem",
                border: "2px solid var(--stroke)",
                boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                display: "grid",
                placeItems: "center",
                background: "white",
              }}
            >
              {/* usa tu ruta real */}
              <img
                src="/beso-logo.png"
                alt="BESO"
                style={{ width: 90, height: 90, objectFit: "contain" }}
              />
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
              Crea tu cuenta
            </h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Únete para disfrutar de todos los beneficios
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div style={{ background: "var(--panel)", padding: "2.25rem 2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
            Registro
          </h2>

          <form
            onSubmit={onSubmit}
            style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}
          >
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
                  autoComplete="given-name"
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
                  autoComplete="family-name"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span>Correo</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="tucorreo@beso.com"
                required
                autoComplete="email"
              />
            </label>

            <div
              className="grid"
              style={{ gap: 12, gridTemplateColumns: "1fr 1fr" }}
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 4,
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
                <Link href="/login" className="link" prefetch>
                  Inicia sesión
                </Link>
              </div>
            </div>
          </form>

          <p className="muted" style={{ marginTop: 12, fontSize: ".9rem" }}>
            * Los datos de teléfono, DPI y dirección se completarán durante la
            compra.
          </p>
        </div>
      </section>

      <style jsx>{`
        @media (min-width: 860px) {
          section.panel {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}
