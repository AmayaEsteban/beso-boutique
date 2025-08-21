import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { nombre, descripcion } = (await req.json()) as {
      nombre?: string;
      descripcion?: string | null;
    };

    const data: { nombre?: string; descripcion?: string | null } = {};
    if (typeof nombre === "string") data.nombre = nombre.trim();
    if (typeof descripcion !== "undefined") data.descripcion = descripcion;

    const updated = await prisma.categoria.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al actualizar categoría" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.categoria.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al eliminar categoría" },
      { status: 400 }
    );
  }
}
