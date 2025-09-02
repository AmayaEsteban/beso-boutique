import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DevolucionProveedorEstado } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const dev = await prisma.devolucionProveedor.findUnique({
    where: { id },
    include: {
      proveedor: { select: { nombre: true } },
      items: {
        include: {
          producto: { select: { nombre: true } },
          variante: {
            select: {
              sku: true,
              color: { select: { nombre: true } },
              talla: { select: { codigo: true } },
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!dev)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({
    id: dev.id,
    idProveedor: dev.idProveedor,
    fecha: dev.fecha.toISOString(),
    estado: dev.estado,
    nota: dev.nota ?? null,
    proveedor: dev.proveedor ? { nombre: dev.proveedor.nombre } : null,
    items: dev.items.map((it) => ({
      id: it.id,
      idProducto: it.idProducto,
      idVariante: it.idVariante ?? null,
      cantidad: it.cantidad,
      motivo: it.motivo ?? null,
      producto: { nombre: it.producto?.nombre ?? `#${it.idProducto}` },
      variante: it.variante
        ? {
            sku: it.variante.sku ?? null,
            color: it.variante.color?.nombre ?? null,
            talla: it.variante.talla?.codigo ?? null,
          }
        : null,
    })),
  });
}

/* actualizar estado / nota */
type PutBody = {
  estado?: DevolucionProveedorEstado;
  nota?: string | null;
};

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const body = (await req.json()) as PutBody;
  const data: { estado?: DevolucionProveedorEstado; nota?: string | null } = {};
  if (
    body.estado &&
    ["borrador", "emitida", "recibida", "cancelada"].includes(body.estado)
  ) {
    data.estado = body.estado;
  }
  if (body.nota !== undefined) data.nota = body.nota;

  const updated = await prisma.devolucionProveedor.update({
    where: { id },
    data,
    select: { id: true },
  });
  return NextResponse.json(updated);
}

/* eliminar completa (opcional) */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  await prisma.devolucionProveedor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
