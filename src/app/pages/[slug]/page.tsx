// src/app/pages/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

/* ===== Tipos ===== */
type PageProps = { params: { slug: string } };

/* ===== Metadata por página ===== */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const slug = params.slug.toLowerCase();
  const page = await prisma.paginaCMS.findUnique({
    where: { slug },
    select: { titulo: true, contenido: true, activo: true },
  });

  if (!page || !page.activo) {
    return { title: "Página no encontrada | BESO Boutique" };
  }

  const description =
    (page.contenido && page.contenido.replace(/<[^>]+>/g, "").slice(0, 140)) ||
    page.titulo;

  return {
    title: `${page.titulo} | BESO Boutique`,
    description,
  };
}

/* ===== Generación estática de slugs activos ===== */
export async function generateStaticParams() {
  const list = await prisma.paginaCMS.findMany({
    where: { activo: true },
    select: { slug: true },
  });
  return list.map((p) => ({ slug: p.slug }));
}

/* ===== Icons (heredan currentColor) ===== */
function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <path
        d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M18 20H7a3 3 0 0 0-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8 8h8M8 12h8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
      <circle cx="5" cy="7" r="1.6" fill="currentColor" />
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="5" cy="17" r="1.6" fill="currentColor" />
      <path
        d="M9 7h10M9 12h10M9 17h10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ===== Página pública por slug ===== */
export default async function PublicCMSPage({ params }: PageProps) {
  const slug = params.slug.toLowerCase();

  const [page, list] = await Promise.all([
    prisma.paginaCMS.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        titulo: true,
        contenido: true,
        activo: true,
      },
    }),
    prisma.paginaCMS.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { titulo: "asc" }],
      select: { id: true, slug: true, titulo: true },
    }),
  ]);

  if (!page || !page.activo) {
    return (
      <section
        className="container"
        style={{ maxWidth: 1040, padding: "2rem 1rem" }}
      >
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Página no encontrada</h1>
          <p className="muted mt-1">
            La página solicitada no existe o está inactiva.
          </p>
        </header>
        {list.length > 0 && (
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <ListIcon />
              <h3 className="font-semibold">Otras páginas disponibles</h3>
            </div>
            <nav className="grid" style={{ gap: 6 }}>
              {list.map((i) => (
                <Link key={i.id} className="link" href={`/pages/${i.slug}`}>
                  {i.titulo}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className="container"
      style={{ maxWidth: 1160, padding: "2rem 1rem" }}
    >
      {/* Encabezado */}
      <header className="panel p-6 mb-6" style={{ borderRadius: 8 }}>
        <div className="flex items-center gap-2">
          <BookIcon />
          <h1 className="text-3xl font-bold">{page.titulo}</h1>
        </div>
        <p className="muted mt-2">Centro de información y políticas de BESO.</p>
      </header>

      {/* Layout con menú lateral */}
      <div
        className="grid"
        style={{
          gap: 16,
          gridTemplateColumns: "minmax(220px, 260px) 1fr",
          alignItems: "start",
        }}
      >
        <aside className="panel p-3" style={{ position: "sticky", top: 12 }}>
          <div className="flex items-center gap-2 mb-2">
            <ListIcon />
            <div className="font-semibold">Centro de información</div>
          </div>
          <nav className="grid" style={{ gap: 6 }}>
            {list.map((i) => (
              <Link
                key={i.id}
                href={`/pages/${i.slug}`}
                className={`link block ${
                  i.slug === page.slug ? "font-semibold" : ""
                }`}
              >
                {i.titulo}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="panel p-5" style={{ lineHeight: 1.75 }}>
          {/* Permitimos HTML administrado desde el panel */}
          <div dangerouslySetInnerHTML={{ __html: page.contenido }} />
        </article>
      </div>
    </section>
  );
}
