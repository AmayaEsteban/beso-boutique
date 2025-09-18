// src/app/banners/page.tsx
"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: number;
  titulo: string | null;
  imagenUrl: string;
  linkUrl: string | null;
  orden: number;
  activo: boolean;
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState({
    titulo: "",
    imagenUrl: "",
    linkUrl: "",
    orden: 0,
    activo: true,
  });

  const loadBanners = async () => {
    const res = await fetch("/api/admin/banners");
    setBanners(await res.json());
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({
        titulo: "",
        imagenUrl: "",
        linkUrl: "",
        orden: 0,
        activo: true,
      });
      loadBanners();
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    loadBanners();
  };

  return (
    <main className="container" style={{ padding: "2rem" }}>
      <h1>Gestión de Banners</h1>

      <form
        onSubmit={save}
        className="panel"
        style={{ margin: "1rem 0", padding: "1rem" }}
      >
        <h2>Nuevo Banner</h2>
        <input
          placeholder="Título"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="input"
        />
        <input
          placeholder="URL Imagen"
          value={form.imagenUrl}
          onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
          className="input"
          required
        />
        <input
          placeholder="Link opcional"
          value={form.linkUrl}
          onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Orden"
          value={form.orden}
          onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
          className="input"
        />
        <label>
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          />{" "}
          Activo
        </label>
        <button className="btn btn--primary" style={{ marginTop: 8 }}>
          Guardar
        </button>
      </form>

      <ul className="grid gap-2">
        {banners.map((b) => (
          <li key={b.id} className="panel" style={{ padding: "1rem" }}>
            <strong>{b.titulo ?? "Sin título"}</strong>
            <div>
              <img
                src={b.imagenUrl}
                alt={b.titulo ?? ""}
                style={{ maxWidth: 200 }}
              />
            </div>
            <p>Orden: {b.orden}</p>
            <p>Activo: {b.activo ? "✅" : "❌"}</p>
            <button className="btn btn--danger" onClick={() => remove(b.id)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
