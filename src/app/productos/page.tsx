import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Filters from "./_components/Filters";
import ProductCard from "./_components/ProductCard";
import { Prisma } from "@prisma/client";

const LOW_STOCK_THRESHOLD = 5;

export const metadata: Metadata = {
  title: "Catálogo | BESO Boutique",
  description: "Explora nuestro catálogo de productos BESO Boutique.",
};

type SearchParamsShape = {
  color?: string;
  talla?: string;
  orden?: "recientes" | "precio_asc" | "precio_desc";
  q?: string;
};

type PageProps = { searchParams: Promise<SearchParamsShape> };

type ProductoWithRelations = Prisma.ProductoGetPayload<{
  include: {
    imagenes: true;
    categoria: true;
    variantes: { include: { color: true; talla: true } };
  };
}>;

type ProductoEnriquecido = ProductoWithRelations & {
  priceMin: number;
  priceMax: number;
  totalStock: number;
  lowStock: boolean;
  sizeStock: Record<string, number>;
};

export default async function CatalogoPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const colorId = sp?.color ? Number(sp.color) : undefined;
  const tallaId = sp?.talla ? Number(sp.talla) : undefined;
  const orden = sp?.orden;
  const q = (sp?.q ?? "").trim();

  const whereAnd: Prisma.ProductoWhereInput[] = [{ publicado: true }];
  if (q.length) {
    whereAnd.push({
      OR: [{ nombre: { contains: q } }, { descripcion: { contains: q } }],
    });
  }
  if (colorId || tallaId) {
    whereAnd.push({
      variantes: {
        some: {
          ...(colorId ? { idColor: colorId } : {}),
          ...(tallaId ? { idTalla: tallaId } : {}),
        },
      },
    });
  }
  const where: Prisma.ProductoWhereInput = { AND: whereAnd };

  const orderBy: Prisma.ProductoOrderByWithRelationInput[] | undefined =
    orden === "precio_asc" || orden === "precio_desc"
      ? undefined
      : [{ creadoEn: "desc" }];

  const productos = (await prisma.producto.findMany({
    where,
    orderBy,
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      categoria: true,
      variantes: { include: { color: true, talla: true } },
    },
  })) as ProductoWithRelations[];

  const [colores, tallas] = await Promise.all([
    prisma.color.findMany({ orderBy: { nombre: "asc" } }),
    prisma.talla.findMany({ orderBy: { orden: "asc" } }),
  ]);

  const enriched: ProductoEnriquecido[] = productos.map((p) => {
    const variantPrices = p.variantes.map((v) =>
      (v.precio ?? p.precio).toNumber()
    );
    const prices = variantPrices.length ? variantPrices : [p.precio.toNumber()];
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
      if (code) sizeStock[code] = (sizeStock[code] ?? 0) + (v.stock ?? 0);
    }
    return { ...p, priceMin, priceMax, totalStock, lowStock, sizeStock };
  });

  const sorted =
    orden === "precio_asc"
      ? [...enriched].sort((a, b) => a.priceMin - b.priceMin)
      : orden === "precio_desc"
      ? [...enriched].sort((a, b) => b.priceMin - a.priceMin)
      : enriched;

  return (
    <main className="container" style={{ display: "grid", gap: 24 }}>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Catálogo</h1>
        <p className="muted mt-1">
          Explora nuestras colecciones y filtra por color, talla u orden.
        </p>
      </header>

      <div
        style={{ display: "grid", gap: 24, gridTemplateColumns: "280px 1fr" }}
      >
        <aside>
          <Filters
            colores={colores}
            tallas={tallas}
            selectedColor={colorId}
            selectedTalla={tallaId}
            selectedOrden={orden}
            q={q}
          />
        </aside>

        <section>
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            }}
          >
            {sorted.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                nombre={p.nombre}
                slug={`/productos/${p.id}`}
                imagenUrl={
                  p.imagenes[0]?.url ??
                  p.imagenUrl ??
                  "/placeholder-product.png"
                }
                categoria={p.categoria?.nombre ?? ""}
                priceMin={p.priceMin}
                priceMax={p.priceMax}
                hasRange={p.priceMin !== p.priceMax}
                totalStock={p.totalStock}
                lowStock={p.lowStock}
                sizeStock={p.sizeStock}
              />
            ))}
            {sorted.length === 0 && (
              <div className="muted">
                No encontramos productos con esos filtros.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
