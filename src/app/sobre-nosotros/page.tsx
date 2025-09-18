// src/app/sobre-nosotros/page.tsx
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

/* ===== Icons (heredan currentColor) ===== */
function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M12 11v6M12 8h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 2v3M22 12h-3M12 22v-3M2 12h3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
      <path
        d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.9 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await prisma.sobreNosotros.findUnique({ where: { id: 1 } });
  const title = s?.titulo?.trim() || "Sobre nosotros | BESO Boutique";
  const description =
    (s?.contenido && s.contenido.replace(/<[^>]+>/g, "").slice(0, 140)) ||
    "Conoce la historia, misión, visión y valores de BESO Boutique.";
  return { title, description };
}

export default async function SobreNosotrosPage() {
  const s = await prisma.sobreNosotros.findUnique({ where: { id: 1 } });

  const valoresList =
    s?.valores
      ?.split(/\r?\n|,|·|•/g)
      .map((v) => v.trim())
      .filter(Boolean) || [];

  return (
    <section
      className="container"
      style={{ maxWidth: 1040, padding: "2rem 1rem" }}
    >
      {/* Hero */}
      <header className="panel p-6 mb-6" style={{ textAlign: "center" }}>
        <div className="flex items-center gap-2 justify-center">
          <InfoIcon />
          <h1 className="text-3xl font-bold">
            {s?.titulo || "Sobre BESO Boutique"}
          </h1>
        </div>
        {s?.contenido ? (
          <p
            className="muted mt-2"
            dangerouslySetInnerHTML={{ __html: s.contenido }}
          />
        ) : (
          <p className="muted mt-2">
            Moda que se siente bien: calidad, estilo y un servicio que te
            acompaña.
          </p>
        )}
      </header>

      {/* Misión y Visión */}
      {(s?.mision || s?.vision) && (
        <div
          className="grid gap-6 mb-6"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          {s?.mision && (
            <article className="panel p-5">
              <div className="flex items-center gap-2 mb-2">
                <TargetIcon />
                <h3 className="font-bold">Nuestra misión</h3>
              </div>
              <div dangerouslySetInnerHTML={{ __html: s.mision }} />
            </article>
          )}
          {s?.vision && (
            <article className="panel p-5">
              <div className="flex items-center gap-2 mb-2">
                <EyeIcon />
                <h3 className="font-bold">Nuestra visión</h3>
              </div>
              <div dangerouslySetInnerHTML={{ __html: s.vision }} />
            </article>
          )}
        </div>
      )}

      {/* Valores */}
      {valoresList.length > 0 && (
        <section className="panel p-5 mb-6">
          <h3 className="font-bold mb-3">Nuestros valores</h3>
          <ul
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            {valoresList.map((v, i) => (
              <li key={i} className="flex items-start gap-2">
                <StarIcon />
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA */}
      <div className="panel p-5" style={{ textAlign: "center" }}>
        <h3 className="font-bold mb-2">¿Hablamos?</h3>
        <p className="mb-4">
          Si necesitas asesoría de tallas o estilo, estamos para ayudarte.
        </p>
        <a href="/contacto" className="btn primary">
          Ir a Contáctanos
        </a>
      </div>
    </section>
  );
}
