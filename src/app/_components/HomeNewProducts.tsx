// src/app/_components/HomeNewProducts.tsx
"use client";

import { useState } from "react";
import ProductCard from "@/app/productos/_components/ProductCard";
import type { HomeCardItem } from "../page";

type Props = {
  initialItems: HomeCardItem[];
  pageSize: number;
  initialHasMore: boolean;
};

export default function HomeNewProducts({
  initialItems,
  pageSize,
  initialHasMore,
}: Props) {
  const [items, setItems] = useState<HomeCardItem[]>(initialItems);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);

  async function loadMore(): Promise<void> {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/home-products?page=${page + 1}&take=${pageSize}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Error al cargar más productos");
      const data = (await res.json()) as { items: HomeCardItem[] };
      setItems((prev) => [...prev, ...data.items]);
      setPage((p) => p + 1);
      if (data.items.length < pageSize) setHasMore(false);
    } catch (e) {
      console.error(e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="grid"
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {items.map((p, idx) => (
          <ProductCard
            key={`${p.id}-${idx}`}
            id={p.id}
            nombre={p.nombre}
            slug={`/productos/${p.id}`}
            imagenUrl={p.imagenUrl}
            categoria={p.categoria}
            priceMin={p.priceMin}
            priceMax={p.priceMax}
            hasRange={p.hasRange}
            totalStock={p.totalStock}
            lowStock={p.lowStock}
            sizeStock={p.sizeStock}
            appearDelay={idx * 60} // animación en cascada
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            className="btn primary"
            onClick={() => void loadMore()}
            disabled={loading}
            style={{
              minWidth: 180,
              position: "relative",
              overflow: "hidden",
            }}
            aria-live="polite"
          >
            {loading ? "Cargando…" : "Mostrar más"}
            {/* Ripple/shine simple */}
            {!loading && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(120deg, transparent 0%, rgba(255,255,255,.15) 30%, transparent 60%)",
                  transform: "translateX(-120%)",
                  animation: "shine 2.2s infinite",
                }}
              />
            )}
          </button>
          <style jsx>{`
            @keyframes shine {
              0% {
                transform: translateX(-120%);
              }
              100% {
                transform: translateX(120%);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
