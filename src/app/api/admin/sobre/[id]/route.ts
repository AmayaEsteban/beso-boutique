import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

type PatchBody = {
  titulo?: string;
  contenido?: string;
  mision?: string | null;
  vision?: string | null;
  valores?: string | null;
};

export async function PUT(req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const body = (await req.json()) as PatchBody;

  const data: {
    titulo?: string;
    contenido?: string;
    mision?: string | null;
    vision?: string | null;
    valores?: string | null;
  } = {};

  if (typeof body.titulo === "string") data.titulo = body.titulo.trim();
  if (typeof body.contenido === "string")
    data.contenido = body.contenido.trim();
  if (typeof body.mision !== "undefined")
    data.mision = body.mision?.trim() || null;
  if (typeof body.vision !== "undefined")
    data.vision = body.vision?.trim() || null;
  if (typeof body.valores !== "undefined")
    data.valores = body.valores?.trim() || null;

  const updated = await prisma.sobreNosotros.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  // Puedes bloquear borrar el #1 si quieres; yo lo permito para consistencia.
  await prisma.sobreNosotros.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
