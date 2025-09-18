import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { email, activo } = (await req.json()) as {
      email?: string;
      activo?: boolean;
    };

    const data: { email?: string; activo?: boolean } = {};
    if (typeof email === "string") data.email = email.trim().toLowerCase();
    if (typeof activo === "boolean") data.activo = activo;

    const updated = await prisma.suscriptorNewsletter.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al actualizar suscriptor" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.suscriptorNewsletter.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al eliminar suscriptor" },
      { status: 400 }
    );
  }
}
