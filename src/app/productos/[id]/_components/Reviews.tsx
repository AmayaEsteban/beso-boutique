"use client";

import React, { useState } from "react";

type Props = { productoId: number };

export default function Reviews({ productoId }: Props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [comentario, setComentario] = useState("");
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`/api/productos/${productoId}/resenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email: email.trim() || undefined,
          comentario: comentario.trim() || undefined,
          rating,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "No se pudo guardar tu reseña.");
      }

      // Limpia el form
      setNombre("");
      setEmail("");
      setComentario("");
      setRating(5);
      alert("¡Gracias por tu reseña!");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel p-3" style={{ borderRadius: 10 }}>
      <h3 className="font-bold mb-2">Reseñas</h3>

      <label className="block mb-2">
        <span>Nombre</span>
        <input
          className="input w-full"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </label>

      <label className="block mb-2">
        <span>Email (opcional)</span>
        <input
          className="input w-full"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tú@correo.com"
        />
      </label>

      <div className="mb-2">
        <span>Calificación</span>
        <div className="flex items-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              title={`${n}/5`}
              aria-label={`${n} estrellas`}
              className={n <= rating ? "text-yellow-500" : "text-gray-400"}
              style={{ fontSize: 20, lineHeight: 1 }}
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm">{rating}/5</span>
        </div>
      </div>

      <label className="block mb-3">
        <span>Comentario (opcional)</span>
        <textarea
          className="input w-full"
          rows={3}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </label>

      <button className="btn btn--primary" disabled={sending}>
        {sending ? "Enviando…" : "Enviar reseña"}
      </button>
    </form>
  );
}
