import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { slug: string } };

export async function GET(_req: Request, { params }: Params) {
  const slug = params.slug.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "slug requerido" }, { status: 400 });
  }

  const page = await prisma.paginaCMS.findUnique({ where: { slug } });
  if (!page || !page.activo) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    id: page.id,
    slug: page.slug,
    titulo: page.titulo,
    contenido: page.contenido,
  });
}
