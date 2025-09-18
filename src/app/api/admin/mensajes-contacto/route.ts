import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Lista de mensajes con filtros (sin any) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const desde = searchParams.get("desde"); // YYYY-MM-DD
  const hasta = searchParams.get("hasta"); // YYYY-MM-DD
  const order = (searchParams.get("order") ?? "fecha") as "fecha" | "id";
  const dir = (searchParams.get("dir") ?? "desc") === "asc" ? "asc" : "desc";
  const dirDb: Prisma.SortOrder = dir;

  const where: Prisma.MensajeContactoWhereInput = {};

  if (q) {
    where.OR = [
      { nombre: { contains: q } },
      { email: { contains: q } },
      { telefono: { contains: q } },
      { asunto: { contains: q } },
      { mensaje: { contains: q } },
    ];
  }

  if (desde || hasta) {
    const rango: Prisma.DateTimeFilter = {};
    if (desde) rango.gte = new Date(`${desde}T00:00:00`);
    if (hasta) rango.lte = new Date(`${hasta}T23:59:59`);
    where.creado_en = rango;
  }

  const rows = await prisma.mensajeContacto.findMany({
    where,
    orderBy: order === "id" ? { id: dirDb } : { creado_en: dirDb },
  });

  return NextResponse.json(rows);
}
