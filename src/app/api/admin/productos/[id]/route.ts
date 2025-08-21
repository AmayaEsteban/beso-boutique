import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseSizes, formatSizes, validateSizes } from "@/lib/sizes";

type Params = { params: { id: string } };

// PUT /api/admin/productos/[id]
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
      data.precio = new Prisma.Decimal(precioNum); // ✅ sin any
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

    // Manejo de categoría por relación (evita tocar FK directa)
    if (typeof body.idCategoria !== "undefined") {
      data.categoria =
        body.idCategoria === null
          ? { disconnect: true }
          : typeof body.idCategoria === "number"
          ? { connect: { id: body.idCategoria } }
          : undefined;
    }

    const updated = await prisma.producto.update({
      where: { id },
      data,
      include: { categoria: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al actualizar producto" },
      { status: 400 }
    );
  }
}

// DELETE /api/admin/productos/[id]
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
