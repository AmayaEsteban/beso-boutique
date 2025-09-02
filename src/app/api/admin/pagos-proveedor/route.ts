import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* Helpers */
const toInt = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const toDateOrNull = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

/* ====== LISTAR ====== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idCompra = toInt(searchParams.get("compra"));
  const desde = searchParams.get("desde"); // yyyy-mm-dd
  const hasta = searchParams.get("hasta"); // yyyy-mm-dd
  const dir = (
    (searchParams.get("dir") ?? "desc") === "asc" ? "asc" : "desc"
  ) as "asc" | "desc";
  const order = (
    (searchParams.get("order") ?? "fecha") === "id" ? "id" : "fecha"
  ) as "fecha" | "id";

  const where: Prisma.PagoProveedorWhereInput = {};
  if (Number.isFinite(idCompra)) where.idCompra = idCompra as number;

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

  const data = await prisma.pagoProveedor.findMany({
    where,
    orderBy: order === "id" ? { id: dir } : { fecha: dir },
    include: {
      compra: {
        select: {
          id: true,
          idProveedor: true,
          proveedor: { select: { nombre: true } },
        },
      },
    },
  });

  // ⬇️ Normalización alineada con lo que la UI espera
  const normalized = data.map((p) => ({
    id: p.id,
    idCompra: p.idCompra,
    monto: Number(p.monto),
    metodo: p.metodo ?? null,
    referencia: p.referencia ?? null,
    fecha: p.fecha.toISOString(),
    nota: p.nota ?? null,

    // Por conveniencia en la raíz (opcional)
    idProveedor: p.compra?.idProveedor ?? null,
    proveedorNombre: p.compra?.proveedor?.nombre ?? null,

    // Estructura que la tabla suele leer (compra.idProveedor y compra.proveedor.nombre)
    compra: {
      id: p.compra?.id ?? null,
      idProveedor: p.compra?.idProveedor ?? null,
      proveedor: p.compra?.proveedor
        ? { nombre: p.compra.proveedor.nombre }
        : null,
    },
  }));

  return NextResponse.json(normalized);
}

/* ====== CREAR ====== */
type Body = {
  idCompra: number;
  monto: number;
  metodo?: string | null;
  referencia?: string | null;
  fecha?: string | null; // ISO o yyyy-mm-dd
  nota?: string | null;
};

export async function POST(req: Request) {
  const b = (await req.json()) as Body;

  if (!Number.isFinite(b.idCompra) || b.idCompra <= 0) {
    return NextResponse.json({ error: "idCompra inválido" }, { status: 400 });
  }
  if (!Number.isFinite(b.monto) || b.monto <= 0) {
    return NextResponse.json({ error: "monto inválido" }, { status: 400 });
  }

  const fecha =
    (b.fecha && toDateOrNull(b.fecha)) ||
    (b.fecha && toDateOrNull(`${b.fecha}T00:00:00`)) ||
    new Date();

  const created = await prisma.pagoProveedor.create({
    data: {
      idCompra: b.idCompra,
      monto: b.monto,
      metodo: b.metodo ?? null,
      referencia: b.referencia ?? null,
      fecha,
      nota: b.nota ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
