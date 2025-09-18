import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(banner);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al obtener banner" },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { titulo, imagenUrl, linkUrl, orden, activo } =
      (await req.json()) as {
        titulo?: string | null;
        imagenUrl?: string;
        linkUrl?: string | null;
        orden?: number;
        activo?: boolean;
      };

    const data: {
      titulo?: string | null;
      imagenUrl?: string;
      linkUrl?: string | null;
      orden?: number;
      activo?: boolean;
    } = {};

    if (typeof titulo !== "undefined") data.titulo = titulo?.trim() ?? null;
    if (typeof imagenUrl === "string") data.imagenUrl = imagenUrl.trim();
    if (typeof linkUrl !== "undefined") data.linkUrl = linkUrl?.trim() ?? null;
    if (typeof orden === "number") data.orden = orden;
    if (typeof activo === "boolean") data.activo = activo;

    const updated = await prisma.banner.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al actualizar banner" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al eliminar banner" },
      { status: 400 }
    );
  }
}
