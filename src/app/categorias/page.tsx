// src/app/categorias/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/app/productos/_components/ProductCard";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categorías | BESO Boutique",
  description: "Explora las categorías con una vista previa de productos.",
};

// Tipos para enriquecer fichas
type ProductoWithRelations = Prisma.ProductoGetPayload<{
  include: {
    imagenes: true;
    categoria: true;
    variantes: { include: { color: true; talla: true } };
  };
}>;

const LOW_STOCK_THRESHOLD = 5;

function PlusCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-dashed hover:border-primary transition"
      title={`Ver más en ${label}`}
      aria-label={`Ver más en ${label}`}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          aspectRatio: "3 / 4",
          display: "grid",
          placeItems: "center",
          background: "var(--soft)",
        }}
      >
        <div className="text-5xl leading-none">+</div>
      </div>
      <div className="p-3 text-center font-medium">Ver más</div>
    </Link>
  );
}

export default async function CategoriasIndexPage() {
  // Traemos categorías
  const categorias = await prisma.categoria.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  // Para cada categoría: 3 productos publicados más recientes
  const previews = await Promise.all(
    categorias.map(async (c) => {
      const productos = (await prisma.producto.findMany({
        where: { publicado: true, categoriaId: c.id },
        orderBy: [{ creadoEn: "desc" }],
        include: {
          imagenes: { orderBy: { orden: "asc" } },
          categoria: true,
          variantes: { include: { color: true, talla: true } },
        },
        take: 3, // <- ahora 3 productos
      })) as ProductoWithRelations[];

      // Enriquecer para ProductCard
      const enriched = productos.map((p) => {
        const variantPrices = p.variantes.map((v) =>
          (v.precio ?? p.precio).toNumber()
        );
        const prices =
          variantPrices.length > 0 ? variantPrices : [p.precio.toNumber()];
        const clean = prices.filter((n) => !Number.isNaN(n));
        const priceMin = clean.length
          ? Math.min(...clean)
          : p.precio.toNumber();
        const priceMax = clean.length
          ? Math.max(...clean)
          : p.precio.toNumber();

        const totalStock =
          p.variantes.length > 0
            ? p.variantes.reduce((acc, v) => acc + (v.stock ?? 0), 0)
            : p.stock ?? 0;

        const lowStock = totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD;

        const sizeStock: Record<string, number> = {};
        for (const v of p.variantes) {
          const code = (v.talla?.codigo ?? "").toUpperCase();
          if (!code) continue;
          sizeStock[code] = (sizeStock[code] ?? 0) + (v.stock ?? 0);
        }

        return { p, priceMin, priceMax, totalStock, lowStock, sizeStock };
      });

      return { categoria: c, productos: enriched };
    })
  );

  return (
    <main className="container grid gap-8">
      <header className="mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Categorías</h1>
        <p className="muted mt-1">Todas nuestras categorias</p>
      </header>

      <section className="grid gap-10">
        {previews.map(({ categoria, productos }) => (
          <div key={categoria.id} className="grid gap-3">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold">{categoria.nombre}</h2>
              <Link href={`/categorias/${categoria.id}`} className="btn ghost">
                Ver categoría
              </Link>
            </div>

            <div
              className="grid"
              style={{
                display: "grid",
                gap: 20,
                // pensada para 4 columnas en desktop (3 productos + “+”)
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              }}
            >
              {productos.map(
                (
                  { p, priceMin, priceMax, totalStock, lowStock, sizeStock },
                  idx
                ) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    nombre={p.nombre}
                    slug={`/productos/${p.id}`} // cámbialo a slug real si lo tienes
                    imagenUrl={
                      p.imagenes[0]?.url ??
                      p.imagenUrl ??
                      "/placeholder-product.png"
                    }
                    categoria={p.categoria?.nombre ?? ""}
                    priceMin={priceMin}
                    priceMax={priceMax}
                    hasRange={priceMin !== priceMax}
                    totalStock={totalStock}
                    lowStock={lowStock}
                    sizeStock={sizeStock}
                    appearDelay={idx * 60}
                  />
                )
              )}

              {/* Ficha “+” siempre presente como cuarta tarjeta */}
              <PlusCard
                href={`/categorias/${categoria.id}`}
                label={categoria.nombre}
              />
            </div>
          </div>
        ))}

        {previews.length === 0 && (
          <div className="muted">Aún no hay categorías.</div>
        )}
      </section>
    </main>
  );
}
