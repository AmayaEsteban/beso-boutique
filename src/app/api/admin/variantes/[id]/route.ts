import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ===== Utilidades de validación (mismas que en route.ts) ===== */
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
  const n = Number(String(v));
  return Number.isFinite(n) ? Number(n.toFixed(2)) : String(v);
}

/* ===== PUT: actualizar variante ===== */
export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const id = parsePositiveInt(ctx.params.id);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const raw = (await req.json()) as Record<string, unknown>;

  const idProducto = parsePositiveInt(raw.idProducto);
  if (idProducto === null) {
    return NextResponse.json(
      { error: "idProducto requerido" },
      { status: 400 }
    );
  }

  const data = {
    idProducto,
    idColor:
      raw.idColor === null || raw.idColor === ""
        ? null
        : parsePositiveInt(raw.idColor) ?? null,
    idTalla:
      raw.idTalla === null || raw.idTalla === ""
        ? null
        : parsePositiveInt(raw.idTalla) ?? null,
    sku: toNullableTrimmed(raw.sku),
    precio: toPrecio(raw.precio),
    stock: parsePositiveInt(raw.stock) ?? 0,
    imagenUrl: toNullableTrimmed(raw.imagenUrl),
  };

  const updated = await prisma.productoVariante.update({
    where: { id },
    data,
  });

  const withRels = await prisma.productoVariante.findUnique({
    where: { id: updated.id },
    include: {
      producto: { select: { id: true, nombre: true } },
      color: true,
      talla: true,
    },
  });

  return NextResponse.json(withRels);
}

/* ===== DELETE: eliminar variante ===== */
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const id = parsePositiveInt(ctx.params.id);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await prisma.productoVariante.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
