"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BannerPublic = {
  id: number;
  titulo: string | null;
  imagenUrl: string;
  linkUrl: string | null;
};

export default function HomeCarousel() {
  const [items, setItems] = useState<BannerPublic[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/banners-public");
      const data = (await res.json()) as BannerPublic[];
      setItems(data);
    })();
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items]);

  if (items.length === 0) return null;
  const current = items[idx];

  const body = (
    <img
      src={current.imagenUrl}
      alt={current.titulo ?? ""}
      style={{
        width: "100%",
        height: 380,
        objectFit: "cover",
        borderRadius: 12,
      }}
    />
  );

  return (
    <div className="panel p-0" style={{ overflow: "hidden" }}>
      {current.linkUrl ? (
        <Link href={current.linkUrl} aria-label={current.titulo ?? "Banner"}>
          {body}
        </Link>
      ) : (
        body
      )}

      {/* Controles simples */}
      <div className="flex justify-center gap-2 py-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Ir al slide ${i + 1}`}
            className={i === idx ? "badge ok" : "badge"}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
