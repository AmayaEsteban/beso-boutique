// src/app/api/admin/compras/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/compras/[id]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 params es Promise
) {
  // 👇 hay que await a params antes de usarlo
  const { id } = await ctx.params;
  const compraId = Number(id);

  if (!Number.isFinite(compraId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  // Traemos compra + proveedor + detalle (con nombre de producto)
  const compra = await prisma.compra.findUnique({
    where: { id: compraId },
    include: {
      proveedor: { select: { nombre: true } },
      detalleCompras: {
        include: { producto: { select: { nombre: true } } },
      },
    },
  });

  if (!compra) {
    return NextResponse.json(
      { error: "Compra no encontrada" },
      { status: 404 }
    );
  }

  // Traemos pagos por relación separada (evitamos depender del nombre del campo relacional)
  const pagos = await prisma.pagoProveedor.findMany({
    where: { idCompra: compraId },
    orderBy: { fecha: "asc" },
  });

  // Normalizamos decimales a number
  const detalle = compra.detalleCompras.map((d) => ({
    idProducto: d.idProducto,
    cantidad: d.cantidad,
    precioUnitario: Number(d.precioUnitario),
    producto: d.producto ? { nombre: d.producto.nombre } : null,
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
    // tu schema actual no tiene "nota" en Compra; lo exponemos como null para no romper el front
    nota: null as string | null,
    proveedor: compra.proveedor ? { nombre: compra.proveedor.nombre } : null,
    detalleCompras: detalle,
    pagosProveedor: pagosNorm,
  };

  return NextResponse.json(payload);
}
