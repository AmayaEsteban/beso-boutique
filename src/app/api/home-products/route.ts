// src/app/api/home-products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 5;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const take = Math.min(
    48,
    Math.max(1, Number(url.searchParams.get("take") || "12"))
  );
  const skip = (page - 1) * take;

  const productos = await prisma.producto.findMany({
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      categoria: true,
      variantes: { include: { color: true, talla: true } },
    },
    orderBy: [{ id: "desc" }],
    take,
    skip,
  });

  const items = productos.map((p) => {
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
      id: p.id,
      nombre: p.nombre,
      imagenUrl:
        p.imagenes[0]?.url ?? p.imagenUrl ?? "/placeholder-product.png",
      categoria: p.categoria?.nombre ?? "",
      priceMin,
      priceMax,
      hasRange: priceMin !== priceMax,
      totalStock,
      lowStock,
      sizeStock,
    };
  });

  return NextResponse.json({ items });
}
