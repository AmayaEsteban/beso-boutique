// src/app/categorias/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductCard from "@/app/productos/_components/ProductCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageParams = { params: { id: string } };

type ProductoWithRelations = Prisma.ProductoGetPayload<{
  include: {
    imagenes: true;
    categoria: true;
    variantes: { include: { color: true; talla: true } };
  };
}>;

const LOW_STOCK_THRESHOLD = 5;

export async function generateMetadata({ params }: PageParams) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return { title: "Categoría | BESO Boutique" };
  }
  const cat = await prisma.categoria.findUnique({
    where: { id },
    select: { nombre: true },
  });
  const nombre = cat?.nombre ?? "Categoría";
  return {
    title: `${nombre} | BESO Boutique`,
    description: `Productos publicados en la categoría ${nombre}.`,
  };
}

export default async function CategoriaPage({ params }: PageParams) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const categoria = await prisma.categoria.findUnique({
    where: { id },
    select: { id: true, nombre: true },
  });
  if (!categoria) notFound();

  // Productos publicados de esta categoría
  const productos = (await prisma.producto.findMany({
    where: { publicado: true, categoriaId: id },
    orderBy: [{ creadoEn: "desc" }],
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      categoria: true,
      variantes: { include: { color: true, talla: true } },
    },
  })) as ProductoWithRelations[];

  // Enriquecer para ProductCard
  const enriched = productos.map((p) => {
    const variantPrices = p.variantes.map((v) =>
      (v.precio ?? p.precio).toNumber()
    );
    const prices =
      variantPrices.length > 0 ? variantPrices : [p.precio.toNumber()];
    const clean = prices.filter((n) => !Number.isNaN(n));
    const priceMin = clean.length ? Math.min(...clean) : p.precio.toNumber();
    const priceMax = clean.length ? Math.max(...clean) : p.precio.toNumber();

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

  return (
    <main className="container grid gap-6">
      <header className="mb-2 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {categoria.nombre}
          </h1>
          <p className="muted mt-1">
            {enriched.length} producto{enriched.length === 1 ? "" : "s"}{" "}
            publicados
          </p>
        </div>
        <Link href="/categorias" className="btn ghost">
          Ver todas las categorías
        </Link>
      </header>

      <section
        className="grid"
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {enriched.map(
          ({ p, priceMin, priceMax, totalStock, lowStock, sizeStock }, idx) => (
            <ProductCard
              key={p.id}
              id={p.id}
              nombre={p.nombre}
              slug={`/productos/${p.id}`} // ajusta a slug real si lo usas
              imagenUrl={
                p.imagenes[0]?.url ?? p.imagenUrl ?? "/placeholder-product.png"
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

        {enriched.length === 0 && (
          <div className="muted">
            No hay productos publicados en esta categoría.
          </div>
        )}
      </section>
    </main>
  );
}
