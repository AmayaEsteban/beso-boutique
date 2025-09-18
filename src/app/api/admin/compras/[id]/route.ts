import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/compras/[id]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const compraId = Number(id);

  if (!Number.isFinite(compraId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const compra = await prisma.compra.findUnique({
    where: { id: compraId },
    include: {
      proveedor: { select: { nombre: true } },
      detalleCompras: {
        include: {
          producto: { select: { nombre: true } },
          variante: {
            include: {
              color: { select: { nombre: true } },
              talla: { select: { codigo: true } },
            },
          },
        },
      },
    },
  });

  if (!compra) {
    return NextResponse.json(
      { error: "Compra no encontrada" },
      { status: 404 }
    );
  }

  const pagos = await prisma.pagoProveedor.findMany({
    where: { idCompra: compraId },
    orderBy: { fecha: "asc" },
  });

  const detalle = compra.detalleCompras.map((d) => ({
    idProducto: d.idProducto,
    idVariante: d.idVariante ?? null,
    cantidad: d.cantidad,
    precioUnitario: Number(d.precioUnitario),
    producto: d.producto ? { nombre: d.producto.nombre } : null,
    variante: d.variante
      ? {
          sku: d.variante.sku,
          color: d.variante.color ? { nombre: d.variante.color.nombre } : null,
          talla: d.variante.talla ? { codigo: d.variante.talla.codigo } : null,
        }
      : null,
  }));

  const pagosNorm = pagos.map((p) => ({
    id: p.id,
    idCompra: p.idCompra,
    monto: Number(p.monto),
    metodo: p.metodo ?? null,
    referencia: p.referencia ?? null,
    fecha: p.fecha.toISOString(),
    nota: p.nota ?? null,
  }));

  const payload = {
    id: compra.id,
    idProveedor: compra.idProveedor,
    fecha: compra.fecha.toISOString(),
    total: compra.total ? Number(compra.total) : 0,
    nota: null as string | null,
    proveedor: compra.proveedor ? { nombre: compra.proveedor.nombre } : null,
    detalleCompras: detalle,
    pagosProveedor: pagosNorm,
  };

  return NextResponse.json(payload);
}
