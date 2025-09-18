// src/components/ui/home-carousel.tsx
"use client";

import * as React from "react";

type Banner = {
  id: number;
  imagenUrl: string;
  linkUrl?: string | null;
  titulo?: string | null;
};

type Props = {
  banners: Banner[];
  intervalMs?: number;
  aspect?: "16/9" | "21/9" | "4/3";
};

export default function HomeCarousel({
  banners,
  intervalMs = 4500,
  aspect = "16/9",
}: Props) {
  const [idx, setIdx] = React.useState(0);
  const count = banners.length;

  // auto-play
  React.useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [count, intervalMs]);

  const goto = (i: number) => setIdx((i + count) % count);
  const prev = () => goto(idx - 1);
  const next = () => goto(idx + 1);

  // pausa al hover
  const hoverRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (count <= 1) return;
    let timer: number | null = null;
    const el = hoverRef.current;
    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      stop();
      timer = window.setInterval(
        () => setIdx((i) => (i + 1) % count),
        intervalMs
      );
    };
    // iniciamos manual para cubrir caso de entrar ya con hover
    start();
    el?.addEventListener("mouseenter", stop);
    el?.addEventListener("mouseleave", start);
    return () => {
      el?.removeEventListener("mouseenter", stop);
      el?.removeEventListener("mouseleave", start);
      if (timer) window.clearInterval(timer);
    };
  }, [count, intervalMs]);

  if (count === 0) {
    return (
      <div className="panel p-6 text-center">
        <div className="muted">No hay banners activos.</div>
      </div>
    );
  }

  // relación de aspecto
  const aspectPadding =
    aspect === "21/9" ? "42.85%" : aspect === "4/3" ? "75%" : "56.25%"; // 16/9 por defecto

  return (
    <div className="panel p-0 overflow-hidden relative" ref={hoverRef}>
      {/* viewport */}
      <div
        className="relative w-full"
        style={{ paddingTop: aspectPadding, background: "var(--bg-elev)" }}
      >
        {/* Slides */}
        <div
          className="absolute inset-0"
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "100%",
            transform: `translateX(-${idx * 100}%)`,
            transition: "transform .5s ease",
          }}
          aria-live="polite"
        >
          {banners.map((b) => {
            const img = (
              <img
                key={b.id}
                src={b.imagenUrl}
                alt={b.titulo ?? "Banner"}
                loading="eager"
                decoding="async"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            );
            return b.linkUrl ? (
              <a key={b.id} href={b.linkUrl} aria-label={b.titulo ?? "Ver más"}>
                {img}
              </a>
            ) : (
              <div key={b.id}>{img}</div>
            );
          })}
        </div>
      </div>

      {/* Flechas */}
      {count > 1 && (
        <>
          <button
            className="icon-btn"
            aria-label="Anterior"
            onClick={prev}
            style={{
              position: "absolute",
              top: "50%",
              left: 8,
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,.35)",
              color: "white",
              borderRadius: 999,
              width: 38,
              height: 38,
            }}
          >
            ‹
          </button>
          <button
            className="icon-btn"
            aria-label="Siguiente"
            onClick={next}
            style={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,.35)",
              color: "white",
              borderRadius: 999,
              width: 38,
              height: 38,
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Bullets */}
      {count > 1 && (
        <div
          className="absolute"
          style={{
            left: 0,
            right: 0,
            bottom: 8,
            display: "flex",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {banners.map((b, i) => (
            <button
              key={b.id}
              aria-label={`Ir al slide ${i + 1}`}
              onClick={() => goto(i)}
              style={{
                width: idx === i ? 20 : 8,
                height: 8,
                borderRadius: 999,
                background:
                  idx === i ? "var(--primary)" : "rgba(255,255,255,.8)",
                border: "1px solid rgba(0,0,0,.15)",
                transition: "all .25s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
