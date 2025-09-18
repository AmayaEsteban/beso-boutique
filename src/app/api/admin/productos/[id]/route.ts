// src/app/api/admin/productos/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseSizes, formatSizes, validateSizes } from "@/lib/sizes";

type Params = { params: { id: string } };

// ======================= GET (one) =======================
export async function GET(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const p = await prisma.producto.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      precio: true,
      imagenUrl: true,
      publicado: true, // NUEVO
      publicadoEn: true, // NUEVO
    },
  });

  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(p);
}

// ======================= PUT (update campos generales) =======================
export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = (await req.json()) as {
      nombre?: string;
      descripcion?: string | null;
      precio?: number | string;
      stock?: number | string;
      talla?: string;
      color?: string | null;
      imagenUrl?: string | null;
      idCategoria?: number | null;
      publicado?: boolean; // NUEVO: opcional aquí también
    };

    const data: Prisma.ProductoUpdateInput = {};

    if (typeof body.nombre === "string") {
      const n = body.nombre.trim();
      if (n) data.nombre = n;
    }

    if (typeof body.descripcion !== "undefined") {
      data.descripcion = body.descripcion ?? null;
    }

    if (typeof body.precio !== "undefined") {
      const precioNum =
        typeof body.precio === "number"
          ? body.precio
          : Number((body.precio ?? "").toString());
      if (Number.isNaN(precioNum) || precioNum < 0) {
        return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
      }
      data.precio = new Prisma.Decimal(precioNum);
    }

    if (typeof body.stock !== "undefined") {
      const stockNum =
        typeof body.stock === "number"
          ? body.stock
          : Number((body.stock ?? "").toString());
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        return NextResponse.json({ error: "Stock inválido" }, { status: 400 });
      }
      data.stock = stockNum;
    }

    if (typeof body.talla === "string") {
      const sizes = parseSizes(body.talla);
      if (!validateSizes(sizes)) {
        return NextResponse.json(
          { error: "Tallas inválidas" },
          { status: 400 }
        );
      }
      data.talla = formatSizes(sizes);
    }

    if (typeof body.color !== "undefined") {
      data.color = body.color ?? null;
    }

    if (typeof body.imagenUrl !== "undefined") {
      data.imagenUrl = body.imagenUrl ?? null;
    }

    if (typeof body.idCategoria !== "undefined") {
      data.categoria =
        body.idCategoria === null
          ? { disconnect: true }
          : typeof body.idCategoria === "number"
          ? { connect: { id: body.idCategoria } }
          : undefined;
    }

    // NUEVO: si viene 'publicado' en PUT también lo aplicamos
    if (typeof body.publicado === "boolean") {
      data.publicado = body.publicado;
      data.publicadoEn = body.publicado ? new Date() : null;
    }

    const updated = await prisma.producto.update({
      where: { id },
      data,
      include: { categoria: true, imagenes: { orderBy: { orden: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al actualizar producto" },
      { status: 400 }
    );
  }
}

// ======================= PATCH (toggle publicado) =======================
// body: { publicado: boolean }
export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const body = (await req.json()) as { publicado?: unknown };
    if (typeof body.publicado !== "boolean") {
      return NextResponse.json(
        { error: "Campo 'publicado' requerido (boolean)" },
        { status: 400 }
      );
    }

    const updated = await prisma.producto.update({
      where: { id },
      data: {
        publicado: body.publicado,
        publicadoEn: body.publicado ? new Date() : null,
      },
      select: { id: true, publicado: true, publicadoEn: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al actualizar estado" },
      { status: 400 }
    );
  }
}

// ======================= DELETE =======================
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.producto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al eliminar producto" },
      { status: 400 }
    );
  }
}
