// src/app/api/admin/compras/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type JWT } from "next-auth/jwt";
import { Prisma } from "@prisma/client";

/* ============== helpers ============== */
const toInt = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

function tokenUserId(token: JWT | null): number | null {
  if (!token) return null;
  // 1) Si el JWT trae `id` numérico
  if ("id" in token && typeof token.id === "number") return token.id;
  // 2) Si solo trae `sub` string convertible a número
  if (typeof token.sub === "string") {
    const n = Number(token.sub);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/* ============== LISTAR (GET) ============== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const proveedor = searchParams.get("proveedor"); // idProveedor (string)
  const desde = searchParams.get("desde"); // yyyy-mm-dd
  const hasta = searchParams.get("hasta"); // yyyy-mm-dd
  const order = (
    (searchParams.get("order") ?? "fecha") === "id" ? "id" : "fecha"
  ) as "fecha" | "id";
  const dir = (
    (searchParams.get("dir") ?? "desc") === "asc" ? "asc" : "desc"
  ) as "asc" | "desc";

  // ✅ Tipado exacto con Prisma
  const where: Prisma.CompraWhereInput = {};

  if (proveedor) {
    const idProveedor = toInt(proveedor);
    if (Number.isFinite(idProveedor)) where.idProveedor = idProveedor as number;
  }

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

  const data = await prisma.compra.findMany({
    where,
    orderBy: order === "id" ? { id: dir } : { fecha: dir },
    include: {
      proveedor: { select: { nombre: true } },
      _count: { select: { detalleCompras: true } },
    },
  });

  // Normalizamos algunos campos numéricos/decimales a number plano
  const normalized = data.map((c) => ({
    id: c.id,
    idProveedor: c.idProveedor,
    fecha: c.fecha.toISOString(),
    total: c.total ? Number(c.total) : 0,
    nota: null as string | null, // en tu schema actual Compra no tiene "nota"
    proveedor: c.proveedor ? { nombre: c.proveedor.nombre } : null,
    _count: { detalleCompras: c._count.detalleCompras },
  }));

  return NextResponse.json(normalized);
}

/* ============== CREAR (POST) ============== */
type DetalleBody = {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
};
type Body = {
  idProveedor: number;
  fecha?: string; // yyyy-mm-dd opcional
  nota?: string | null; // ignorado en schema actual, se permite en body sin usarlo
  detalles: DetalleBody[];
};

export async function POST(req: Request) {
  const body: Body = await req.json();

  // Validaciones básicas
  if (!Number.isFinite(body.idProveedor) || body.idProveedor <= 0) {
    return NextResponse.json(
      { error: "idProveedor inválido" },
      { status: 400 }
    );
  }
  if (!Array.isArray(body.detalles) || body.detalles.length === 0) {
    return NextResponse.json({ error: "detalles requeridos" }, { status: 400 });
  }
  for (const d of body.detalles) {
    if (!Number.isFinite(d.idProducto) || d.idProducto <= 0) {
      return NextResponse.json(
        { error: "idProducto inválido" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(d.cantidad) || d.cantidad <= 0) {
      return NextResponse.json({ error: "cantidad inválida" }, { status: 400 });
    }
    if (!Number.isFinite(d.precioUnitario) || d.precioUnitario < 0) {
      return NextResponse.json(
        { error: "precioUnitario inválido" },
        { status: 400 }
      );
    }
  }

  // Fecha (opcional)
  const fecha =
    typeof body.fecha === "string" && body.fecha.length >= 10
      ? new Date(`${body.fecha}T00:00:00`)
      : new Date();

  // Usuario opcional desde token (✅ sin any)
  let idUsuario: number | null = null;
  try {
    const nextReq = new NextRequest(req.url, {
      headers: req.headers,
      method: req.method,
    });
    const token = await getToken({
      req: nextReq,
      secret: process.env.NEXTAUTH_SECRET,
    });
    idUsuario = tokenUserId(token);
  } catch {
    idUsuario = null;
  }

  // total
  const total = body.detalles.reduce(
    (acc, d) => acc + d.cantidad * d.precioUnitario,
    0
  );

  // Transacción: compra + detalles
  const created = await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        idProveedor: body.idProveedor,
        idUsuario: idUsuario ?? undefined,
        fecha,
        total,
      },
    });

    await tx.detalleCompra.createMany({
      data: body.detalles.map((d) => ({
        idCompra: compra.id,
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
      })),
    });

    return compra;
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
