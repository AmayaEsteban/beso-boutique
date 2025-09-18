"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PublicPage = {
  id: number;
  slug: string;
  titulo: string;
};

export default function FooterCMS() {
  const [items, setItems] = useState<PublicPage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/public/paginas", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as PublicPage[];
        if (!aborted) setItems(data);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  // Enlaces fijos que NO van en el header
  const staticExtraLinks: Array<{ href: string; label: string; key: string }> =
    [
      { href: "/faq", label: "Preguntas frecuentes (FAQs)", key: "faqs" },
      {
        href: "/newsletter",
        label: "Suscripción al newsletter",
        key: "newsletter",
      },
    ];

  // Normalizamos CMS -> links y evitamos duplicados si existe un slug igual
  const allLinks = useMemo(() => {
    const cmsLinks = items.map((p) => ({
      href: `/pages/${p.slug}`,
      label: p.titulo,
      key: `cms:${p.slug}`,
    }));

    // evita duplicar si hay CMS con slug 'faqs' o 'newsletter'
    const cmsSlugs = new Set(items.map((p) => p.slug.toLowerCase()));
    const extras = staticExtraLinks.filter((x) => !cmsSlugs.has(x.key));

    return [...cmsLinks, ...extras];
  }, [items]);

  // Partimos en 2 columnas similares
  const [colA, colB] = useMemo(() => {
    const a: typeof allLinks = [];
    const b: typeof allLinks = [];
    allLinks.forEach((it, i) => (i % 2 === 0 ? a : b).push(it));
    return [a, b];
  }, [allLinks]);

  return (
    <footer aria-labelledby="cms-footer-heading">
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full"
        style={{
          background: "var(--panel)",
          borderTop: "1px solid var(--stroke)",
          borderBottom: "1px solid var(--stroke)",
          padding: "12px 0",
        }}
      >
        <span className="muted">Back to top</span>
      </button>

      {/* Banda de links */}
      <div
        style={{
          background: "var(--bg)",
          borderTop: "1px solid var(--stroke)",
        }}
      >
        <div
          className="container"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 16px" }}
        >
          <h2 id="cms-footer-heading" className="sr-only">
            Enlaces de información
          </h2>

          <div
            className="grid"
            style={{ gap: 20, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
          >
            <div>
              <div
                className="muted"
                style={{ fontWeight: 600, marginBottom: 8 }}
              >
                Información
              </div>
              {loading && <div className="muted">Cargando…</div>}
              {!loading && (
                <ul className="grid" style={{ gap: 6 }}>
                  {colA.map((l) => (
                    <li key={l.key}>
                      <Link href={l.href} className="link">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div
                className="muted"
                style={{ fontWeight: 600, marginBottom: 8 }}
              >
                Más de BESO
              </div>
              {loading && <div className="muted">Cargando…</div>}
              {!loading && (
                <ul className="grid" style={{ gap: 6 }}>
                  {colB.map((l) => (
                    <li key={l.key}>
                      <Link href={l.href} className="link">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Línea inferior */}
          <div
            className="muted"
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--stroke)",
              fontSize: ".9rem",
            }}
          >
            ©️ {new Date().getFullYear()} BESO Boutique. Todos los derechos
            reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
