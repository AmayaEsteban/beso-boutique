"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
      redirect: false, // 👈 importante para manejar redirección manual
    });

    setLoading(false);

    if (res?.ok) {
      alert("Inicio de sesión exitoso 🎉");
      router.push("/"); // 👈 redirige a página principal
    } else {
      alert("Credenciales inválidas");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="panel" style={{ padding: "1rem" }}>
        <label style={{ display: "block", marginBottom: 8 }}>Correo</label>
        <input
          className="input"
          type="email"
          placeholder="tucorreo@beso.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={{ display: "block", margin: "12px 0 8px" }}>
          Contraseña
        </label>
        <input
          className="input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
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
    </div>
  );
}
