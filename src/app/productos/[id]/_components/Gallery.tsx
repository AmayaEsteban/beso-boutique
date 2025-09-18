"use client";

import React from "react";

type Props = { images: string[] };

export default function Gallery({ images }: Props) {
  const [idx, setIdx] = React.useState<number>(0);
  const current = images[idx] ?? images[0];

  return (
    <div className="grid gap-3">
      <div
        className="w-full rounded-xl bg-white/40 overflow-hidden border border-[var(--stroke)]"
        style={{ aspectRatio: "1/1" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={`Imagen ${idx + 1}`}
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setIdx(i)}
              className={`shrink-0 rounded-lg border ${
                i === idx
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-[var(--stroke)]"
              }`}
              style={{ width: 76, height: 76 }}
              aria-label={`Ver imagen ${i + 1}`}
              title={`Ver imagen ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Miniatura ${i + 1}`}
                className="w-full h-full object-cover rounded-md"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
