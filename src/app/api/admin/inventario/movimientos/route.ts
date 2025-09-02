// src/app/api/admin/inventario/movimientos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken, type JWT } from "next-auth/jwt";

/* =========================
   Tipos y helpers
========================= */
type TipoMov = "ingreso" | "egreso" | "ajuste";

type BodyMov = {
  idProducto: number;
  idVariante: number | null;
  tipo: TipoMov;
  cantidad: number;
  referencia: string | null;
  nota: string | null;
};

const isTipoMov = (v: unknown): v is TipoMov =>
  v === "ingreso" || v === "egreso" || v === "ajuste";

const toInt = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
};
const toStr = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

function parseBody(raw: unknown): BodyMov | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const idProducto = toInt(r.idProducto);
  const idVariante =
    r.idVariante === null || r.idVariante === undefined
      ? null
      : toInt(r.idVariante);
  const cantidad = toInt(r.cantidad);
  const tipoRaw = r.tipo;
  const referencia = toStr(r.referencia);
  const nota = toStr(r.nota);

  if (!isTipoMov(tipoRaw)) return null;
  if (idProducto == null) return null;
  if (cantidad == null || cantidad < 0) return null;

  return {
    idProducto,
    idVariante,
    tipo: tipoRaw,
    cantidad,
    referencia: referencia ?? null,
    nota: nota ?? null,
  };
}

/** Extrae un userId numérico del token sin usar `any` */
function getUserIdFromToken(token: JWT | null): number | null {
  if (!token) return null;

  // 1) Si el token incluye una propiedad `id` numérica
  const rec = token as Record<string, unknown>;
  if ("id" in rec && typeof rec.id === "number" && Number.isFinite(rec.id)) {
    return Math.trunc(rec.id);
  }

  // 2) Si no, probamos con `sub`
  if (typeof token.sub === "string") {
    const n = Number(token.sub);
    if (Number.isFinite(n)) return Math.trunc(n);
  }

  return null;
}

/* =========================
   GET: listar movimientos
========================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idProducto = toInt(searchParams.get("producto"));
  const idVarianteParam = searchParams.get("variante");
  const idVariante =
    idVarianteParam === null
      ? null
      : idVarianteParam === ""
      ? null
      : toInt(idVarianteParam);
  const tipo = searchParams.get("tipo");
  const dir = (searchParams.get("dir") ?? "desc") as "asc" | "desc";

  const where = {
    ...(idProducto != null ? { idProducto } : null),
    ...(idVariante !== null ? { idVariante } : null),
    ...(tipo && isTipoMov(tipo) ? { tipo } : null),
  };

  const data = await prisma.inventarioMovimiento.findMany({
    where,
    orderBy: { fecha: dir },
    include: {
      producto: { select: { id: true, nombre: true } },
      variante: {
        select: {
          id: true,
          sku: true,
          color: { select: { id: true, nombre: true, hex: true } },
          talla: { select: { id: true, codigo: true } },
        },
      },
      usuario: { select: { id: true, nombre: true, email: true } },
    },
    take: 200,
  });

  return NextResponse.json(data);
}

/* =========================
   POST: crear movimiento
========================= */
export async function POST(req: Request) {
  // 1) Parseo body
  const parsed = parseBody(await req.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json(
      { error: "Body inválido. Revise idProducto, tipo y cantidad." },
      { status: 400 }
    );
  }

  const { idProducto, idVariante, tipo, cantidad, referencia, nota } = parsed;

  // 2) Obtener token (App Router exige NextRequest)
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
    idUsuario = getUserIdFromToken(token);
  } catch {
    idUsuario = null;
  }

  // 3) Transacción: ajustar stock y registrar
  const result = await prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUnique({
      where: { id: idProducto },
      select: { id: true, stock: true },
    });
    if (!producto) {
      throw NextResponse.json({ error: "Producto no existe" }, { status: 400 });
    }

    let newStock: number;

    if (idVariante != null) {
      const variante = await tx.productoVariante.findUnique({
        where: { id: idVariante },
        select: { id: true, stock: true },
      });
      if (!variante) {
        throw NextResponse.json(
          { error: "Variante no existe" },
          { status: 400 }
        );
      }

      if (tipo === "ingreso") {
        newStock = variante.stock + cantidad;
      } else if (tipo === "egreso") {
        if (variante.stock - cantidad < 0) {
          throw NextResponse.json(
            { error: "Stock insuficiente en la variante" },
            { status: 400 }
          );
        }
        newStock = variante.stock - cantidad;
      } else {
        newStock = cantidad; // ajuste
      }

      await tx.productoVariante.update({
        where: { id: idVariante },
        data: { stock: newStock },
      });
    } else {
      const base = producto.stock ?? 0;
      if (tipo === "ingreso") {
        newStock = base + cantidad;
      } else if (tipo === "egreso") {
        if (base - cantidad < 0) {
          throw NextResponse.json(
            { error: "Stock insuficiente en el producto" },
            { status: 400 }
          );
        }
        newStock = base - cantidad;
      } else {
        newStock = cantidad; // ajuste
      }

      await tx.producto.update({
        where: { id: idProducto },
        data: { stock: newStock },
      });
    }

    const creado = await tx.inventarioMovimiento.create({
      data: {
        idProducto,
        idVariante,
        tipo,
        cantidad,
        referencia,
        nota,
        idUsuario, // puede ser null
      },
      include: {
        producto: { select: { id: true, nombre: true } },
        variante: {
          select: {
            id: true,
            sku: true,
            color: { select: { id: true, nombre: true, hex: true } },
            talla: { select: { id: true, codigo: true } },
          },
        },
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });

    return creado;
  });

  return NextResponse.json(result, { status: 201 });
}
