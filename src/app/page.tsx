// src/app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HomeCarousel from "@/components/ui/home-carousel";
import ProductCard from "@/app/productos/_components/ProductCard";
import { Prisma } from "@prisma/client";

export const metadata = {
  title: "BESO Boutique — Inicio",
  description: "Descubre novedades, ofertas y colecciones destacadas.",
};

// Relaciones necesarias para las cards
type ProductoWithRelations = Prisma.ProductoGetPayload<{
  include: {
    imagenes: true;
    categoria: true;
    variantes: { include: { color: true; talla: true } };
  };
}>;

const LOW_STOCK_THRESHOLD = 5;

export default async function Home() {
  const [banners, productos] = await Promise.all([
    prisma.banner.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { publicado: "desc" }],
      select: { id: true, imagenUrl: true, linkUrl: true, titulo: true },
    }),
    prisma.producto.findMany({
      where: { publicado: true }, // 👈 solo publicados
      include: {
        imagenes: { orderBy: { orden: "asc" } },
        categoria: true,
        variantes: { include: { color: true, talla: true } },
      },
      orderBy: [{ creadoEn: "desc" }],
      take: 12, // mostramos las 12 más recientes
    }),
  ]);

  // Enriquecer datos para las cards
  const enriched = productos.map((p) => {
    const variantPrices = p.variantes.map((v) =>
      (v.precio ?? p.precio).toNumber()
    );
    const prices =
      variantPrices.length > 0 ? variantPrices : [p.precio.toNumber()];
    const safe = prices.filter((n) => !Number.isNaN(n));

    const priceMin = safe.length ? Math.min(...safe) : p.precio.toNumber();
    const priceMax = safe.length ? Math.max(...safe) : p.precio.toNumber();

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

    return {
      base: p,
      priceMin,
      priceMax,
      totalStock,
      lowStock,
      sizeStock,
    };
  });

  return (
    <section className="grid gap-8">
      {/* Carrusel de banners */}
      <HomeCarousel banners={banners} aspect="21/9" />

      {/* Bloque de productos recientes */}
      <div className="container">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Lo nuevo en <span className="text-primary">BESO</span>
            </h2>
            <p className="muted mt-1">
              Novedades recién llegadas — ¡descúbrelas antes que nadie!
            </p>
          </div>
          <Link href="/productos" className="btn ghost">
            Ver todo
          </Link>
        </div>

        <div
          className="grid"
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {enriched.map((p, idx) => (
            <ProductCard
              key={p.base.id}
              id={p.base.id}
              nombre={p.base.nombre}
              slug={`/productos/${p.base.id}`}
              imagenUrl={
                p.base.imagenes[0]?.url ??
                p.base.imagenUrl ??
                "/placeholder-product.png"
              }
              categoria={p.base.categoria?.nombre ?? ""}
              priceMin={p.priceMin}
              priceMax={p.priceMax}
              hasRange={p.priceMin !== p.priceMax}
              totalStock={p.totalStock}
              lowStock={p.lowStock}
              sizeStock={p.sizeStock}
              appearDelay={idx * 60}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
