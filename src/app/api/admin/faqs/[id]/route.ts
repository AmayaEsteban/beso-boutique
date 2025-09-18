import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

/* ===== GET (opcional, por si lo usas) ===== */
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const faq = await prisma.fAQ.findUnique({ where: { id } });
    if (!faq)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(faq);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al obtener FAQ" },
      { status: 400 }
    );
  }
}

/* ===== PUT: actualizar ===== */
export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { pregunta, respuesta, orden, activo } = (await req.json()) as {
      pregunta?: string;
      respuesta?: string;
      orden?: number;
      activo?: boolean;
    };

    const data: {
      pregunta?: string;
      respuesta?: string;
      orden?: number;
      activo?: boolean;
    } = {};

    if (typeof pregunta !== "undefined") data.pregunta = pregunta.trim();
    if (typeof respuesta !== "undefined") data.respuesta = respuesta.trim();
    if (typeof orden === "number") data.orden = orden;
    if (typeof activo === "boolean") data.activo = activo;

    const updated = await prisma.fAQ.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al actualizar FAQ" },
      { status: 400 }
    );
  }
}

/* ===== DELETE: eliminar ===== */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.fAQ.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al eliminar FAQ" },
      { status: 400 }
    );
  }
}
