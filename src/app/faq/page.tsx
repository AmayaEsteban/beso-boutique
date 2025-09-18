// src/app/faqs/page.tsx
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

/* ===== Icono ===== */
function HelpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9.5 9a2.5 2.5 0 115 0c0 1.5-2 2-2 3.5M12 17h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Preguntas frecuentes | BESO Boutique",
  description:
    "Resuelve tus dudas sobre compras, envíos, devoluciones, pagos y más en BESO Boutique.",
};

export default async function FAQPage() {
  const faqs = await prisma.fAQ.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, pregunta: true, respuesta: true },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.respuesta,
      },
    })),
  };

  return (
    <section
      className="container"
      style={{ maxWidth: 1040, padding: "2rem 1rem" }}
    >
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <HelpIcon />
          <h1 className="text-3xl font-bold">Preguntas frecuentes</h1>
        </div>
        <p className="muted mt-2">
          Encuentra respuestas rápidas sobre envíos, cambios, tallas y más.
        </p>
      </header>

      {/* Lista de FAQs */}
      <div className="grid gap-3">
        {faqs.length === 0 && (
          <div className="panel p-5 muted">
            Aún no hay preguntas frecuentes.
          </div>
        )}
        {faqs.map((f) => (
          <details key={f.id} className="panel p-4">
            <summary className="cursor-pointer font-semibold">
              {f.pregunta}
            </summary>
            <div
              className="mt-3 leading-relaxed"
              // Permitimos HTML desde admin (negritas, links, listas…)
              dangerouslySetInnerHTML={{ __html: f.respuesta }}
            />
          </details>
        ))}
      </div>

      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: render JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
