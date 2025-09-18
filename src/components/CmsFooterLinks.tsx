"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type PublicPage = {
  id: number;
  slug: string;
  titulo: string;
  activo: boolean;
  orden: number;
};

export default function CmsFooterLinks() {
  const [items, setItems] = useState<PublicPage[]>([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      const res = await fetch("/api/public/paginas?activo=true", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as PublicPage[];
      if (!aborted) setItems(data);
    })();
    return () => {
      aborted = true;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Enlaces CMS" className="flex flex-wrap gap-3">
      {items.map((p) => (
        <Link key={p.id} className="link" href={`/pages/${p.slug}`}>
          {p.titulo}
        </Link>
      ))}
    </nav>
  );
}
