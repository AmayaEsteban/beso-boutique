import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ===== Tipos de entrada ===== */
type CreateBody = {
  slug: string;
  titulo: string;
  contenido: string;
  activo?: boolean;
  orden?: number;
};

/* ===== Util ===== */
const toBool = (v: string | null): boolean | null => {
  if (v === null) return null;
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
};
const toInt = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const safeSlug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\-_/]/gu, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const activoParam = toBool(searchParams.get("activo"));
  const order = (searchParams.get("order") ?? "orden") as
    | "orden"
    | "titulo"
    | "creado";
  const dir = (searchParams.get("dir") ?? "asc") === "desc" ? "desc" : "asc";

  const where: Prisma.PaginaCMSWhereInput = {};
  if (q) {
    where.OR = [
      { slug: { contains: q } },
      { titulo: { contains: q } },
      { contenido: { contains: q } },
    ];
  }
  if (activoParam !== null) where.activo = activoParam;

  const data = await prisma.paginaCMS.findMany({
    where,
    orderBy:
      order === "titulo"
        ? { titulo: dir }
        : order === "creado"
        ? { id: dir } // no tienes timestamp propio; usamos id como proxy
        : { orden: dir },
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = (await req.json()) as CreateBody;

  const slug = safeSlug(body.slug ?? "");
  const titulo = (body.titulo ?? "").trim();
  const contenido = (body.contenido ?? "").trim();
  const activo = typeof body.activo === "boolean" ? body.activo : true;
  const orden = Number.isFinite(body.orden) ? Number(body.orden) : 0;

  if (!slug)
    return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
  if (!titulo)
    return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  if (!contenido)
    return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });

  const created = await prisma.paginaCMS.create({
    data: { slug, titulo, contenido, activo, orden },
  });

  return NextResponse.json(created, { status: 201 });
}
