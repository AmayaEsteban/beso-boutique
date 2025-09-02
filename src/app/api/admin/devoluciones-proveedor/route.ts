import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, DevolucionProveedorEstado } from "@prisma/client";

/* Helpers */
const toInt = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

/* ===== LISTAR ===== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const proveedor = toInt(searchParams.get("proveedor"));
  const estado = searchParams.get("estado") as DevolucionProveedorEstado | null;
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const order = (
    (searchParams.get("order") ?? "fecha") === "id" ? "id" : "fecha"
  ) as "fecha" | "id";
  const dir = (
    (searchParams.get("dir") ?? "desc") === "asc" ? "asc" : "desc"
  ) as "asc" | "desc";

  const where: Prisma.DevolucionProveedorWhereInput = {};
  if (Number.isFinite(proveedor)) where.idProveedor = proveedor as number;
  if (
    estado &&
    ["borrador", "emitida", "recibida", "cancelada"].includes(estado)
  )
    where.estado = estado;

  if (desde || hasta) {
    where.fecha = {};
    if (desde)
      (where.fecha as Prisma.DateTimeFilter).gte = new Date(
        `${desde}T00:00:00`
      );
    if (hasta)
      (where.fecha as Prisma.DateTimeFilter).lte = new Date(
        `${hasta}T23:59:59`
      );
  }

  const data = await prisma.devolucionProveedor.findMany({
    where,
    orderBy: order === "id" ? { id: dir } : { fecha: dir },
    include: {
      proveedor: { select: { nombre: true } },
      _count: { select: { items: true } },
    },
  });

  const normalized = data.map((d) => ({
    id: d.id,
    idProveedor: d.idProveedor,
    fecha: d.fecha.toISOString(),
    estado: d.estado,
    nota: d.nota ?? null,
    proveedor: d.proveedor ? { nombre: d.proveedor.nombre } : null,
    _count: { items: d._count.items },
  }));

  return NextResponse.json(normalized);
}

/* ===== CREAR (con items) ===== */
type ItemBody = {
  idProducto: number;
  idVariante?: number | null;
  cantidad: number;
  motivo?: string | null;
};
type Body = {
  idProveedor: number;
  fecha?: string | null; // yyyy-mm-dd
  nota?: string | null;
  items: ItemBody[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!Number.isFinite(body.idProveedor) || body.idProveedor <= 0) {
    return NextResponse.json(
      { error: "idProveedor inválido" },
      { status: 400 }
    );
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items requeridos" }, { status: 400 });
  }
  for (const it of body.items) {
    if (!Number.isFinite(it.idProducto) || it.idProducto <= 0) {
      return NextResponse.json(
        { error: "idProducto inválido" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(it.cantidad) || it.cantidad <= 0) {
      return NextResponse.json({ error: "cantidad inválida" }, { status: 400 });
    }
    if (it.idVariante != null && !Number.isFinite(it.idVariante)) {
      return NextResponse.json(
        { error: "idVariante inválido" },
        { status: 400 }
      );
    }
  }

  const fecha = body.fecha ? new Date(`${body.fecha}T00:00:00`) : new Date();

  const created = await prisma.$transaction(async (tx) => {
    const d = await tx.devolucionProveedor.create({
      data: {
        idProveedor: body.idProveedor,
        fecha,
        nota: body.nota ?? null,
        estado: "borrador",
      },
    });

    await tx.devolucionProveedorItem.createMany({
      data: body.items.map((it) => ({
        idDevolucion: d.id,
        idProducto: it.idProducto,
        idVariante: it.idVariante ?? null,
        cantidad: it.cantidad,
        motivo: it.motivo ?? null,
      })),
    });

    return d;
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
