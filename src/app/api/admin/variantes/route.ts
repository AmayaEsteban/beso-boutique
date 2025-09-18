import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ========= helpers ========= */
type Dir = "asc" | "desc";
type OrderField = "id" | "idProducto" | "sku";

const isDir = (v: unknown): v is Dir => v === "asc" || v === "desc";
const isOrder = (v: unknown): v is OrderField =>
  v === "id" || v === "idProducto" || v === "sku";

const toInt = (v: unknown): number | null => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

const toMoneyStr2 = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
};

const ok = (d: unknown, status = 200) => NextResponse.json(d, { status });
const bad = (m: string, s = 400) =>
  NextResponse.json({ error: m }, { status: s });

/* ========= GET ========= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const idProducto = toInt(searchParams.get("idProducto"));
  const q = (searchParams.get("q") || "").trim();
  const order = isOrder(searchParams.get("order"))
    ? (searchParams.get("order") as OrderField)
    : "id";
  const dir = isDir(searchParams.get("dir"))
    ? (searchParams.get("dir") as Dir)
    : "desc";

  const where: Prisma.ProductoVarianteWhereInput = {};
  if (idProducto !== null) where.idProducto = idProducto;
  // MySQL suele ser case-insensitive por colación *_ci
  if (q) where.sku = { contains: q };

  const data = await prisma.productoVariante.findMany({
    where,
    orderBy: { [order]: dir },
    include: {
      producto: { select: { id: true, nombre: true } },
      color: true,
      talla: true,
    },
  });

  return ok(data);
}

/* ========= POST (crear variante) ========= */
export async function POST(req: Request) {
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== "object") return bad("Payload inválido");

    const r = raw as Record<string, unknown>;

    const idProducto = toInt(r.idProducto);
    if (idProducto === null) return bad("idProducto requerido");

    const base = await prisma.producto.findUnique({
      where: { id: idProducto },
      select: { precio: true, imagenUrl: true },
    });
    if (!base) return bad("Producto no existe", 404);

    const idColor =
      r.idColor == null || r.idColor === "" ? null : toInt(r.idColor);
    if (idColor === null && r.idColor != null && r.idColor !== "")
      return bad("idColor inválido");

    const idTalla =
      r.idTalla == null || r.idTalla === "" ? null : toInt(r.idTalla);
    if (idTalla === null && r.idTalla != null && r.idTalla !== "")
      return bad("idTalla inválido");

    const skuRaw = String(r.sku ?? "")
      .trim()
      .toUpperCase();
    const sku = skuRaw || null; // en tu schema es opcional

    // precio: si viene lo uso, si no uso el del producto base (Decimal)
    const precioStr = toMoneyStr2(r.precio) ?? base.precio.toFixed(2); // <- sin any

    const imagenUrlInput = String(r.imagenUrl ?? "").trim();
    const imagenUrl = imagenUrlInput ? imagenUrlInput : base.imagenUrl ?? null;

    const created = await prisma.productoVariante.create({
      data: {
        idProducto,
        idColor,
        idTalla,
        sku,
        precio: precioStr, // Decimal como string "99.99"
        stock: 0,
        imagenUrl,
      },
      include: {
        producto: { select: { id: true, nombre: true } },
        color: true,
        talla: true,
      },
    });

    return ok(created, 201);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002")
        return bad("SKU duplicado o combinación repetida", 409);
      if (e.code === "P2003")
        return bad("Relación inválida (producto/color/talla)", 400);
    }
    const msg =
      e instanceof Error ? e.message : "Error de servidor al crear variante";
    return bad(msg, 500);
  }
}
