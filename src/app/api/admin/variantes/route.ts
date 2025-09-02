import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ===== Tipos y validadores (sin any) ===== */
type Dir = "asc" | "desc";
type OrderField = "id" | "idProducto" | "sku";

type CreateBody = {
  idProducto: number;
  idColor: number | null;
  idTalla: number | null;
  sku: string | null;
  precio: number | string | null;
  stock: number;
  imagenUrl: string | null;
};

const isDir = (v: unknown): v is Dir => v === "asc" || v === "desc";
const isOrder = (v: unknown): v is OrderField =>
  v === "id" || v === "idProducto" || v === "sku";

function parsePositiveInt(v: unknown): number | null {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function toNullableTrimmed(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function toPrecio(v: unknown): number | string | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  // Prisma Decimal acepta number o string
  const n = Number(String(v));
  return Number.isFinite(n) ? Number(n.toFixed(2)) : String(v);
}

/* ===== GET: listado con filtros e includes ===== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const idProducto = parsePositiveInt(searchParams.get("idProducto"));
  const q = (searchParams.get("q") || "").trim(); // para filtrar SKU
  const order = isOrder(searchParams.get("order"))
    ? (searchParams.get("order") as OrderField)
    : "id";
  const dir = isDir(searchParams.get("dir"))
    ? (searchParams.get("dir") as Dir)
    : "desc";

  const where: {
    idProducto?: number;
    sku?: { contains: string; mode: "insensitive" };
  } = {};

  if (idProducto !== null) where.idProducto = idProducto;
  if (q) where.sku = { contains: q, mode: "insensitive" };

  const data = await prisma.productoVariante.findMany({
    where,
    orderBy: { [order]: dir },
    include: {
      producto: { select: { id: true, nombre: true } },
      color: true,
      talla: true,
    },
  });

  return NextResponse.json(data);
}

/* ===== POST: crear variante (validado) ===== */
export async function POST(req: Request) {
  const raw = (await req.json()) as unknown;

  // Validación manual y “parseo seguro”
  const idProducto = parsePositiveInt(
    (raw as Record<string, unknown>)?.idProducto
  );
  if (idProducto === null) {
    return NextResponse.json(
      { error: "idProducto requerido" },
      { status: 400 }
    );
  }

  const idColorRaw = (raw as Record<string, unknown>)?.idColor;
  const idTallaRaw = (raw as Record<string, unknown>)?.idTalla;

  const body: CreateBody = {
    idProducto,
    idColor:
      idColorRaw === null || idColorRaw === ""
        ? null
        : parsePositiveInt(idColorRaw) ?? null,
    idTalla:
      idTallaRaw === null || idTallaRaw === ""
        ? null
        : parsePositiveInt(idTallaRaw) ?? null,
    sku: toNullableTrimmed((raw as Record<string, unknown>)?.sku),
    precio: toPrecio((raw as Record<string, unknown>)?.precio),
    stock: parsePositiveInt((raw as Record<string, unknown>)?.stock) ?? 0,
    imagenUrl: toNullableTrimmed((raw as Record<string, unknown>)?.imagenUrl),
  };

  const created = await prisma.productoVariante.create({
    data: {
      idProducto: body.idProducto,
      idColor: body.idColor,
      idTalla: body.idTalla,
      sku: body.sku,
      precio: body.precio, // number|string|null — compatible con Decimal
      stock: body.stock,
      imagenUrl: body.imagenUrl,
    },
  });

  // Devolvemos con includes para que la UI tenga todo listo
  const withRels = await prisma.productoVariante.findUnique({
    where: { id: created.id },
    include: {
      producto: { select: { id: true, nombre: true } },
      color: true,
      talla: true,
    },
  });

  return NextResponse.json(withRels, { status: 201 });
}
