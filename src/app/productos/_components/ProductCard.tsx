// src/app/productos/_components/ProductCard.tsx
"use client";

import Link from "next/link";
import React from "react";
import { useSession } from "next-auth/react";

type Props = {
  id: number;
  nombre: string;
  slug: string; // URL de la ficha
  imagenUrl: string;
  categoria: string;
  priceMin: number;
  priceMax: number;
  hasRange: boolean;
  totalStock: number;
  lowStock: boolean;
  sizeStock: Record<string, number>;
  /** SSR hint: si el server cree que hay sesión */
  isLoggedIn?: boolean;
  /** Si true, oculta el corazón cuando no hay sesión (en vez de mostrar el modal) */
  hideWishlistWhenLoggedOut?: boolean;
  /** Por si en el futuro hidratas desde BD */
  initialWished?: boolean;
};

const LOW_STOCK = 5;
const ACCENT = "var(--accent, #B24C5A)";

export default function ProductCard({
  id,
  nombre,
  slug,
  imagenUrl,
  categoria,
  priceMin,
  priceMax,
  hasRange,
  totalStock,
  lowStock,
  sizeStock,
  isLoggedIn = false,
  hideWishlistWhenLoggedOut = false,
  initialWished = false,
}: Props) {
  // Refuerzo en cliente (evita que un SSR viejo te muestre el modal)
  const { status } = useSession();
  const authed = isLoggedIn || status === "authenticated";

  // Estado de wishlist (optimista)
  const [wished, setWished] = React.useState<boolean>(initialWished);
  const [working, setWorking] = React.useState<boolean>(false);

  const toggleWishlist = async () => {
    if (!authed) {
      if (hideWishlistWhenLoggedOut) return;
      window.dispatchEvent(
        new CustomEvent("open-login-modal", { detail: { reason: "wish" } })
      );
      return;
    }
    if (working) return;

    const next = !wished;
    setWished(next); // optimista
    setWorking(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(
          e?.error ?? (next ? "No se pudo guardar" : "No se pudo quitar")
        );
      }
    } catch (err) {
      // revertir
      setWished(!next);
      alert((err as Error).message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <article className="panel p-0 overflow-hidden relative">
      {/* Botón corazón arriba-derecha */}
      {!(!authed && hideWishlistWhenLoggedOut) && (
        <button
          type="button"
          className="absolute right-2 top-2 z-[2] grid place-items-center rounded-full bg-white/90 backdrop-blur p-2 shadow"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist();
          }}
          aria-pressed={wished}
          disabled={working}
          title={
            authed
              ? wished
                ? "Quitar de favoritos"
                : "Añadir a favoritos"
              : "Inicia sesión para guardar"
          }
          aria-label={wished ? "Quitar de favoritos" : "Añadir a favoritos"}
          style={{
            // un poco de feedback cuando está activo
            outline: wished ? `2px solid ${ACCENT}` : undefined,
            outlineOffset: wished ? 1 : undefined,
          }}
        >
          {/* estado vacío (solo trazo) */}
          {!wished ? (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 21s-6.716-4.35-9.192-7.233C.333 11.117.833 7.5 3.6 6.1 6.367 4.7 8.733 6.2 12 9c3.267-2.8 5.633-4.3 8.4-2.9 2.767 1.4 3.267 5.017.792 7.667C18.716 16.65 12 21 12 21z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            // estado relleno
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden
              style={{ color: ACCENT }}
            >
              <path
                d="M12 21s-6.716-4.35-9.192-7.233C.333 11.117.833 7.5 3.6 6.1 6.367 4.7 8.733 6.2 12 9c3.267-2.8 5.633-4.3 8.4-2.9 2.767 1.4 3.267 5.017.792 7.667C18.716 16.65 12 21 12 21z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      )}

      {/* Imagen / link a la ficha */}
      <Link href={slug} className="block">
        <div className="aspect-[4/5] bg-[color-mix(in_srgb,var(--ink),transparent_94%)] overflow-hidden">
          <img
            src={imagenUrl}
            alt={nombre}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      {/* Contenido */}
      <div className="p-3 flex flex-col gap-2">
        <div className="muted text-xs">{categoria}</div>
        <Link href={slug} className="font-semibold leading-snug line-clamp-2">
          {nombre}
        </Link>

        <div className="flex items-baseline gap-2">
          <div className="text-lg font-bold">Q {priceMin.toFixed(2)}</div>
          {hasRange && (
            <div className="muted text-sm">– Q {priceMax.toFixed(2)}</div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs muted">
            Stock: {totalStock}{" "}
            {lowStock && (
              <span className="text-rose-600 font-medium">
                (¡pocas unidades!)
              </span>
            )}
          </div>
        </div>

        {/* Tallas con estado por stock (ámbar <= 5, rojo = 0) */}
        {Object.keys(sizeStock).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(sizeStock)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, qty]) => {
                const base =
                  "px-2 py-0.5 text-xs rounded-full border transition-colors";
                const cls =
                  qty <= 0
                    ? `${base} border-red-500 text-red-600 bg-red-50 line-through`
                    : qty <= LOW_STOCK
                    ? `${base} border-amber-500 text-amber-700 bg-amber-50`
                    : base;
                return (
                  <span
                    key={`${id}-${code}`}
                    className={cls}
                    title={
                      qty <= 0
                        ? "Sin stock"
                        : qty <= LOW_STOCK
                        ? `Pocas unidades (${qty})`
                        : `${qty} disponibles`
                    }
                  >
                    {code}
                  </span>
                );
              })}
          </div>
        )}
      </div>
    </article>
  );
}
