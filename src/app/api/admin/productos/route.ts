// src/app/api/admin/productos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* Utilidades simples para tallas "S,M,L" */
function parseSizes(talla: string): string[] {
  return talla
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function validateSizes(sizes: string[]): boolean {
  return sizes.every((s) => /^[A-Za-z0-9+-]+$/.test(s));
}
function formatSizes(sizes: string[]): string {
  return sizes.join(",");
}

type OrderField = "id" | "precio" | "nombre" | "creado" | "actualizado";
type Dir = "asc" | "desc";
type Status = "activos" | "inactivos" | "todos";

/* ======================= GET (listado) ======================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const catParam = searchParams.get("categoria");
  const idCategoria = catParam ? Number(catParam) : NaN;

  const order = (searchParams.get("order") ?? "id") as OrderField;
  const dir = (searchParams.get("dir") === "asc" ? "asc" : "desc") as Dir;

  // NUEVO: filtro por estado de publicación
  const status = (searchParams.get("status") ?? "todos") as Status; // activos | inactivos | todos

  const where: Prisma.ProductoWhereInput = {
    ...(q
      ? {
          OR: [
            { nombre: { contains: q } },
            { descripcion: { contains: q } },
            { color: { contains: q } },
          ],
        }
      : {}),
    ...(Number.isNaN(idCategoria) ? {} : { categoriaId: idCategoria }),
    ...(status === "activos" ? { publicado: true } : {}),
    ...(status === "inactivos" ? { publicado: false } : {}),
  };

  const orderBy: Prisma.ProductoOrderByWithRelationInput =
    order === "precio"
      ? { precio: dir }
      : order === "nombre"
      ? { nombre: dir }
      : order === "creado"
      ? { creadoEn: dir }
      : order === "actualizado"
      ? { actualizadoEn: dir }
      : { id: dir };

  const productos = await prisma.producto.findMany({
    where,
    orderBy,
    include: { categoria: true, imagenes: { orderBy: { orden: "asc" } } },
  });

  return NextResponse.json(productos);
}

/* ======================= POST (crear) ======================= */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      nombre?: string;
      descripcion?: string | null;
      precio?: number | string;
      stock?: number | string;
      talla?: string;
      color?: string | null;
      imagenUrl?: string | null;
      idCategoria?: number | null;
      publicado?: boolean; // NUEVO
    };

    // nombre
    if (!body.nombre || typeof body.nombre !== "string") {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    // precio (acepta number | string)
    let precioNum: number | null = null;
    if (typeof body.precio !== "undefined") {
      precioNum =
        typeof body.precio === "number"
          ? body.precio
          : Number((body.precio ?? "").toString());
      if (precioNum == null || Number.isNaN(precioNum) || precioNum < 0) {
        return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
      }
    }

    // stock
    let stockNum: number | null = null;
    if (typeof body.stock !== "undefined") {
      stockNum =
        typeof body.stock === "number"
          ? body.stock
          : Number((body.stock ?? "").toString());
      if (stockNum == null || !Number.isInteger(stockNum) || stockNum < 0) {
        return NextResponse.json({ error: "Stock inválido" }, { status: 400 });
      }
    }

    // talla
    let tallaFormatted: string | null = null;
    if (typeof body.talla === "string") {
      const sizes = parseSizes(body.talla);
      if (!validateSizes(sizes)) {
        return NextResponse.json(
          { error: "Tallas inválidas" },
          { status: 400 }
        );
      }
      tallaFormatted = formatSizes(sizes);
    }

    // NUEVO: publicación (por defecto false si no se envía)
    const publicado =
      typeof body.publicado === "boolean" ? body.publicado : false;
    const publicadoEn = publicado ? new Date() : null;

    // objeto tipado
    const data: Prisma.ProductoCreateInput = {
      nombre: body.nombre.trim(),
      descripcion: body.descripcion ?? null,
      precio: precioNum ?? 0,
      stock: stockNum ?? 0,
      talla: tallaFormatted,
      color: body.color ?? null,
      imagenUrl: body.imagenUrl ?? null,
      publicado,
      publicadoEn,
      ...(typeof body.idCategoria === "number"
        ? { categoria: { connect: { id: body.idCategoria } } }
        : {}),
    };

    const created = await prisma.producto.create({
      data,
      include: { categoria: true, imagenes: { orderBy: { orden: "asc" } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al crear producto" },
      { status: 400 }
    );
  }
}
