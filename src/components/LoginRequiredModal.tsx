// src/components/LoginRequiredModal.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  message?: string;
};

export default function LoginRequiredModal({ open, onClose, message }: Props) {
  const router = useRouter();
  if (!open) return null;

  const goLogin = () => {
    const next =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/catalogo";
    router.push(`/login?next=${encodeURIComponent(next)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 92%)",
          margin: "10% auto",
          background: "var(--panel)",
          color: "var(--ink)",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 12px 40px rgba(0,0,0,.35)",
        }}
      >
        <h3 className="font-bold mb-2">Necesitas iniciar sesión</h3>
        <p className="muted mb-4">
          {message ??
            "Para usar tu wishlist o carrito, inicia sesión con tu cuenta BESO."}
        </p>
        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={goLogin}>
            Ir a login
          </button>
        </div>
      </div>
    </div>
  );
}
