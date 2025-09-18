// src/app/productos/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Gallery from "./_components/Gallery";
import VariantPicker from "./_components/VariantPicker";
import Reviews from "./_components/Reviews";

/* =========================
   Tipos (serializables a cliente)
========================= */
type PageParams = { params: { id: string } };

type ProductoWithRels = Prisma.ProductoGetPayload<{
  include: {
    categoria: true;
    imagenes: { select: { id: true; url: true; orden: true } };
    variantes: { include: { color: true; talla: true } };
  };
}>;

type VariantPlain = {
  id: number;
  idProducto: number;
  idColor: number | null;
  idTalla: number | null;
  sku: string | null;
  precio: number | null;
  stock: number;
  imagenUrl: string | null;
  color: { id: number; nombre: string; hex: string | null } | null;
  talla: { id: number; codigo: string } | null;
};

const to2 = (n: number) => n.toFixed(2);

/* ========= Auth (detección simple por cookies) ========= */
async function getIsLoggedIn(): Promise<boolean> {
  const c = await cookies();
  return Boolean(
    c.get("__Secure-next-auth.session-token")?.value ||
      c.get("next-auth.session-token")?.value ||
      c.get("session")?.value ||
      c.get("auth")?.value ||
      c.get("beso_session")?.value
  );
}

/* =========================
   Metadata (Next 15: await params)
========================= */
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return {};

  const p = await prisma.producto.findUnique({
    where: { id: pid, publicado: true },
    select: { nombre: true, descripcion: true, imagenUrl: true },
  });

  if (!p) return {};
  return {
    title: `${p.nombre} | BESO Boutique`,
    description: p.descripcion ?? undefined,
    openGraph: {
      title: p.nombre,
      description: p.descripcion ?? undefined,
      images: p.imagenUrl ? [{ url: p.imagenUrl }] : undefined,
    },
  };
}

/* =========================
   Página
========================= */
export default async function ProductoPage({ params }: PageParams) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) notFound();

  const producto = (await prisma.producto.findUnique({
    where: { id: pid, publicado: true },
    include: {
      categoria: true,
      imagenes: {
        select: { id: true, url: true, orden: true },
        orderBy: { orden: "asc" },
      },
      variantes: { include: { color: true, talla: true } },
    },
  })) as ProductoWithRels | null;

  if (!producto) notFound();

  const basePrice =
    typeof producto.precio === "number"
      ? producto.precio
      : (producto.precio as Prisma.Decimal).toNumber();

  const variantesPlain: VariantPlain[] = producto.variantes.map((v) => ({
    id: v.id,
    idProducto: v.idProducto,
    idColor: v.idColor,
    idTalla: v.idTalla,
    sku: v.sku,
    precio:
      v.precio == null
        ? null
        : typeof v.precio === "number"
        ? v.precio
        : (v.precio as Prisma.Decimal).toNumber(),
    stock: v.stock,
    imagenUrl: v.imagenUrl,
    color: v.color
      ? { id: v.color.id, nombre: v.color.nombre, hex: v.color.hex }
      : null,
    talla: v.talla ? { id: v.talla.id, codigo: v.talla.codigo } : null,
  }));

  const totalStock =
    variantesPlain.length > 0
      ? variantesPlain.reduce((acc, v) => acc + (v.stock ?? 0), 0)
      : producto.stock ?? 0;

  const isLoggedIn = await getIsLoggedIn();

  return (
    <main
      className="container"
      style={{ display: "grid", gap: 24, gridTemplateColumns: "1.1fr 0.9fr" }}
    >
      {/* Galería */}
      <section>
        <Gallery
          images={
            (producto.imagenes?.length ?? 0) > 0
              ? [...producto.imagenes]
                  .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                  .map((img) => img.url)
              : [producto.imagenUrl ?? "/placeholder-product.png"]
          }
        />
        <div className="mt-8">
          <Reviews productoId={producto.id} />
        </div>
      </section>

      {/* Panel derecho */}
      <aside>
        <div className="panel p-4" style={{ position: "sticky", top: 88 }}>
          <div className="muted mb-1">{producto.categoria?.nombre ?? "—"}</div>
          <h1 className="text-2xl font-bold mb-1">{producto.nombre}</h1>

          <div className="text-xl font-semibold mb-1">Q {to2(basePrice)}</div>

          <div className="muted mb-4">Stock: {totalStock}</div>

          <VariantPicker
            productoId={producto.id}
            basePrice={basePrice}
            variantes={variantesPlain}
            publicado={producto.publicado}
            canBuy={producto.publicado && totalStock > 0}
            isLoggedIn={isLoggedIn}
          />

          {producto.descripcion && (
            <>
              <h3 className="font-semibold mt-6">Descripción</h3>
              <p className="muted">{producto.descripcion}</p>
            </>
          )}
        </div>
      </aside>
    </main>
  );
}
