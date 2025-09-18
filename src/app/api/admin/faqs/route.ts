import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

/* ===== GET: lista/filtrado ===== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const activoParam = toBool(searchParams.get("activo"));
  const order = (searchParams.get("order") ?? "orden") as "orden" | "id";
  const dir = (searchParams.get("dir") ?? "asc") === "desc" ? "desc" : "asc";

  const where: Prisma.FAQWhereInput = {};
  if (q)
    where.OR = [{ pregunta: { contains: q } }, { respuesta: { contains: q } }];
  if (activoParam !== null) where.activo = activoParam;

  const data = await prisma.fAQ.findMany({
    where,
    orderBy: order === "id" ? { id: dir } : { orden: dir },
  });

  return NextResponse.json(data);
}

/* ===== POST: crear ===== */
type CreateBody = {
  pregunta: string;
  respuesta: string;
  activo?: boolean;
  orden?: number;
};

export async function POST(req: Request) {
  const body = (await req.json()) as CreateBody;

  const pregunta = (body.pregunta ?? "").trim();
  const respuesta = (body.respuesta ?? "").trim();
  const activo = typeof body.activo === "boolean" ? body.activo : true;
  const orden = Number.isFinite(body.orden) ? Number(body.orden) : 0;

  if (!pregunta) {
    return NextResponse.json(
      { error: "La pregunta es requerida" },
      { status: 400 }
    );
  }
  if (!respuesta) {
    return NextResponse.json(
      { error: "La respuesta es requerida" },
      { status: 400 }
    );
  }

  const created = await prisma.fAQ.create({
    data: { pregunta, respuesta, activo, orden },
  });

  return NextResponse.json(created, { status: 201 });
}
