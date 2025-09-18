"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();

  // bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const qp = search.size ? `?${search.toString()}` : "";
  const callbackUrl = encodeURIComponent(`${pathname}${qp}`);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-[5000] flex items-center justify-center"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,.5)" }}
    >
      <div
        className="panel p-5 w-[min(92vw,420px)]"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 12 }}
      >
        <h3 id="login-modal-title" className="text-lg font-bold mb-2">
          Inicia sesión para continuar
        </h3>
        <p className="muted mb-4">
          Para guardar en favoritos o usar el carrito, por favor inicia sesión.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <a
            className="btn"
            href={`/login?callbackUrl=${callbackUrl}`}
            // Si usas un flow distinto (OAuth, etc.), cambia esta URL
          >
            Ir a login
          </a>
        </div>
      </div>
    </div>
  );
}
