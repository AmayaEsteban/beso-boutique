import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

type UpdateBody = {
  slug?: string;
  titulo?: string;
  contenido?: string;
  activo?: boolean;
  orden?: number;
};

const toId = (s: string): number => Number.parseInt(s, 10);
const safeSlug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\-_/]/gu, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = toId(params.id);
    const page = await prisma.paginaCMS.findUnique({ where: { id } });
    if (!page)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(page);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al obtener la página" },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = toId(params.id);
    const { slug, titulo, contenido, activo, orden } =
      (await req.json()) as UpdateBody;

    const data: UpdateBody = {};
    if (typeof slug === "string") data.slug = safeSlug(slug);
    if (typeof titulo === "string") data.titulo = titulo.trim();
    if (typeof contenido === "string") data.contenido = contenido.trim();
    if (typeof activo === "boolean") data.activo = activo;
    if (typeof orden === "number" && Number.isFinite(orden)) data.orden = orden;

    const updated = await prisma.paginaCMS.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al actualizar página" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = toId(params.id);
    await prisma.paginaCMS.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al eliminar página" },
      { status: 400 }
    );
  }
}
