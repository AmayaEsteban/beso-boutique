import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qOnlyActive = searchParams.get("onlyActive");
  const onlyActive = qOnlyActive === "1" || qOnlyActive === "true";

  const data = await prisma.banner.findMany({
    where: onlyActive ? { activo: true } : undefined,
    orderBy: [{ orden: "asc" }, { publicado: "desc" }],
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      titulo?: string | null;
      imagenUrl: string;
      linkUrl?: string | null;
      orden?: number;
      activo?: boolean;
    };

    if (!body.imagenUrl || typeof body.imagenUrl !== "string") {
      return NextResponse.json(
        { error: "imagenUrl es requerido" },
        { status: 400 }
      );
    }

    const created = await prisma.banner.create({
      data: {
        titulo: body.titulo?.trim() ?? null,
        imagenUrl: body.imagenUrl.trim(),
        linkUrl: body.linkUrl?.trim() ?? null,
        orden: typeof body.orden === "number" ? body.orden : 0,
        activo: typeof body.activo === "boolean" ? body.activo : true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al crear banner" },
      { status: 400 }
    );
  }
}
