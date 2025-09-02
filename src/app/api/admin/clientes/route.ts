import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/admin/clientes?q=
 * Lista clientes con búsqueda por nombre o email.
 * Orden: fecha_registro DESC.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();

    const andClauses: Prisma.ClienteWhereInput[] = [];
    if (q) {
      andClauses.push({
        OR: [{ nombre: { contains: q } }, { email: { contains: q } }],
      });
    }

    const where: Prisma.ClienteWhereInput = andClauses.length
      ? { AND: andClauses }
      : {};

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { fecha_registro: "desc" },
    });

    return NextResponse.json(clientes);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al listar clientes" },
      { status: 400 }
    );
  }
}
