import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ====== helpers ====== */
const safeTitle = (s: string, max = 120) =>
  String(s ?? "")
    .normalize("NFC")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/[^\p{L}\p{N}\s\-]/gu, "")
    .slice(0, max)
    .trim();

const safeText = (s: string, max = 1000) =>
  String(s ?? "")
    .normalize("NFC")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/[^\p{L}\p{N}\s.,;:()/_'"!?¡¿%#@\-]/gu, "")
    .slice(0, max)
    .trim();

const safeURL = (s: string, max = 255) => {
  const v = String(s ?? "")
    .trim()
    .slice(0, max);
  if (!v) return "";
  return /^https?:\/\/[^\s]+$/i.test(v) ? v : "";
};

const safeSKU = (s: string, max = 40) =>
  String(s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, "")
    .slice(0, max);

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

/* ====== POST: crear Producto + Variante (stock=0) ====== */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return bad("Payload inválido");

    const parsed = body as {
      producto?: {
        nombre?: string;
        descripcion?: string | null;
        idCategoria?: number | null;
        imagenUrl?: string | null;
        precio?: number | null;
      };
      variante?: {
        sku?: string;
        precio?: number | null;
        idColor?: number | null;
        idTalla?: number | null;
        imagenUrl?: string | null;
      };
    };

    if (!parsed.producto || !parsed.variante)
      return bad("Faltan datos de producto/variante");

    const p = parsed.producto;
    const v = parsed.variante;

    /* ---- validar producto ---- */
    const nombre = safeTitle(p.nombre ?? "");
    if (!nombre) return bad("Nombre de producto inválido");

    const descripcion = p.descripcion ? safeText(p.descripcion) : "";
    const categoriaId =
      p.idCategoria != null && Number.isFinite(p.idCategoria)
        ? Number(p.idCategoria)
        : null;

    const imgProd = p.imagenUrl ? safeURL(p.imagenUrl) : "";

    const precioProdStr = toMoneyStr2(p.precio) ?? toMoneyStr2(v.precio);
    if (!precioProdStr) return bad("Precio inválido (producto o variante)");

    /* ---- validar variante ---- */
    const sku = safeSKU(v.sku ?? "");
    if (!sku) return bad("SKU inválido");

    const precioVarStr = toMoneyStr2(v.precio) ?? precioProdStr;

    const idColor =
      v.idColor == null
        ? null
        : Number.isFinite(v.idColor)
        ? Number(v.idColor)
        : null;
    const idTalla =
      v.idTalla == null
        ? null
        : Number.isFinite(v.idTalla)
        ? Number(v.idTalla)
        : null;

    const imgVar = v.imagenUrl ? safeURL(v.imagenUrl) : "";

    /* ---- transacción ---- */
    const created = await prisma.$transaction(async (tx) => {
      // Tipamos la variable, sin usar "as any"
      const prodData: Prisma.ProductoUncheckedCreateInput = {
        nombre,
        descripcion: descripcion || null,
        precio: precioProdStr, // Decimal como string
        imagenUrl: imgProd || null,
        categoriaId, // puede ser null
      };

      const prod = await tx.producto.create({ data: prodData });

      const variData: Prisma.ProductoVarianteUncheckedCreateInput = {
        idProducto: prod.id,
        sku,
        precio: precioVarStr, // Decimal como string
        idColor,
        idTalla,
        imagenUrl: imgVar || null,
        stock: 0,
      };

      const vari = await tx.productoVariante.create({
        data: variData,
        include: { color: true, talla: true },
      });

      return { prod, vari };
    });

    return ok({ producto: created.prod, variante: created.vari }, 201);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return bad("SKU duplicado", 409);
      if (e.code === "P2003")
        return bad("Referencia inválida (categoría/color/talla)", 400);
    }
    const msg = e instanceof Error ? e.message : "Error de servidor";
    return bad(msg, 500);
  }
}
