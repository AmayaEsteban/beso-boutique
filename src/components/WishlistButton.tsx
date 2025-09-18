// src/components/WishlistButton.tsx
"use client";

import React, { useState } from "react";
import LoginRequiredModal from "./LoginRequiredModal";

type Props = {
  productId: number;
  isLoggedIn: boolean;
  initiallyInWishlist?: boolean;
  size?: "sm" | "md";
  hideIfLoggedOut?: boolean; // si quieres opción 1 (ocultar icono)
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21s-7.2-4.4-9.6-8.2C-0.7 8.8 1.7 4 6 4c2 0 3.4 1 4 2 .6-1 2-2 4-2 4.3 0 6.7 4.8 3.6 8.8C19.2 16.6 12 21 12 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function WishlistButton({
  productId,
  isLoggedIn,
  initiallyInWishlist = false,
  size = "md",
  hideIfLoggedOut = false,
}: Props) {
  const [openLogin, setOpenLogin] = useState(false);
  const [inWish, setInWish] = useState<boolean>(initiallyInWishlist);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn && hideIfLoggedOut) return null; // Opción 1: ocultar

  const onClick = async () => {
    if (!isLoggedIn) {
      setOpenLogin(true);
      return;
    }
    try {
      setLoading(true);
      if (!inWish) {
        // TODO: ajusta a tu endpoint real
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error("No se pudo agregar a favoritos");
        setInWish(true);
      } else {
        // Endpoint para quitar (ajústalo si es por id de wishlist)
        const res = await fetch(`/api/wishlist?productId=${productId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("No se pudo quitar de favoritos");
        setInWish(false);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const classBase = size === "sm" ? "icon-btn" : "btn"; // usa tus utilidades; aquí lo dejo simple

  return (
    <>
      <button
        className={classBase}
        onClick={onClick}
        title={inWish ? "Quitar de favoritos" : "Añadir a favoritos"}
        aria-label={inWish ? "Quitar de favoritos" : "Añadir a favoritos"}
        disabled={loading}
        style={inWish ? { color: "var(--primary)" } : undefined}
      >
        <HeartIcon filled={inWish} />
        {size !== "sm" && (
          <span style={{ marginLeft: 8 }}>
            {inWish ? "En favoritos" : "Añadir a favoritos"}
          </span>
        )}
      </button>

      <LoginRequiredModal
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        message="Para guardar productos en tu wishlist, inicia sesión."
      />
    </>
  );
}
