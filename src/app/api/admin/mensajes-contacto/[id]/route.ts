import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const row = await prisma.mensajeContacto.findUnique({ where: { id } });
    if (!row)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al obtener mensaje" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.mensajeContacto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al eliminar" },
      { status: 400 }
    );
  }
}
