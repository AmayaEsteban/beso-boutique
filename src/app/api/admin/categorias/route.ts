import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where = q
    ? { OR: [{ nombre: { contains: q } }, { descripcion: { contains: q } }] }
    : {};

  const categorias = await prisma.categoria.findMany({
    where,
    orderBy: { id: "desc" },
  });

  return NextResponse.json(categorias);
}

export async function POST(req: Request) {
  try {
    const { nombre, descripcion } = (await req.json()) as {
      nombre: string;
      descripcion?: string | null;
    };

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const created = await prisma.categoria.create({
      data: { nombre: nombre.trim(), descripcion: descripcion ?? null },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al crear categoría" },
      { status: 400 }
    );
  }
}
