"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      alert("Inicio de sesión exitoso 🎉");
      router.push("/");
    } else {
      alert("Credenciales inválidas");
    }
  }

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
      {/* Card principal (dos columnas en desktop) */}
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
        {/* Lado “hero” (izquierda en desktop) */}
        <div
          style={{
            background: "var(--soft)",
            padding: "3rem 2rem",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            {/* Logo redondeado */}
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
              {/* Reemplaza /logo.png por tu ruta real */}
              <img
                src="/beso-logo.png"
                alt="Logo"
                style={{ width: 90, height: 90, objectFit: "contain" }}
              />
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
              Bienvenido
            </h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Ingresa para gestionar tu cuenta
            </p>
          </div>
        </div>

        {/* Formulario (derecha en desktop) */}
        <div
          style={{
            background: "var(--panel)",
            padding: "2.25rem 2rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
            Iniciar sesión
          </h2>

          <form
            onSubmit={onSubmit}
            style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}
          >
            <label className="grid gap-1">
              <span>Email</span>
              <input
                className="input"
                type="email"
                placeholder="tucorreo@beso.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>

            <label className="grid gap-1">
              <span>Contraseña</span>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn--primary" disabled={loading}>
                {loading ? "Ingresando…" : "Ingresar"}
              </button>
              <button
                type="reset"
                className="btn btn--neutral"
                onClick={() => {
                  setEmail("");
                  setPassword("");
                }}
              >
                Limpiar
              </button>
            </div>
          </form>

          {/* Direccional a registro */}
          <div style={{ marginTop: "1rem", fontSize: ".95rem" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="link" prefetch>
              Regístrate
            </Link>
          </div>
        </div>
      </section>

      {/* Responsive: pasar a dos columnas en pantallas medianas */}
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
