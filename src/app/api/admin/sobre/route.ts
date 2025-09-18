import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  id?: number; // opcional (por si quieres crear otro registro)
  titulo: string;
  contenido: string;
  mision?: string | null;
  vision?: string | null;
  valores?: string | null;
};

/** Lista todo (normalmente habrá 1) */
export async function GET() {
  const data = await prisma.sobreNosotros.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(data);
}

/**
 * Crear o upsert del #1 por conveniencia:
 * si envías id -> crea con ese id (si es posible), si no, crea normal.
 * Si ya existe id=1 y no mandas id, hace upsert en el #1.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const titulo = (body.titulo ?? "").trim();
  const contenido = (body.contenido ?? "").trim();
  const mision = body.mision?.trim() || null;
  const vision = body.vision?.trim() || null;
  const valores = body.valores?.trim() || null;

  if (!titulo)
    return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  if (!contenido)
    return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });

  // si trae id explícito, intentamos create
  if (Number.isFinite(body.id)) {
    const created = await prisma.sobreNosotros.create({
      data: { id: Number(body.id), titulo, contenido, mision, vision, valores },
    });
    return NextResponse.json(created, { status: 201 });
  }

  // si no trae id, hacemos upsert del 1 (patrón singleton)
  const upserted = await prisma.sobreNosotros.upsert({
    where: { id: 1 },
    update: { titulo, contenido, mision, vision, valores },
    create: { id: 1, titulo, contenido, mision, vision, valores },
  });

  return NextResponse.json(upserted, { status: 201 });
}
