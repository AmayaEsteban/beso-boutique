import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.clasificacionAbc.findMany({
    include: { producto: { select: { nombre: true } } },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { idProducto, tipo } = await req.json();
  if (!idProducto || !["A", "B", "C"].includes(tipo)) {
    return NextResponse.json(
      { error: "idProducto y tipo (A|B|C) requeridos" },
      { status: 400 }
    );
  }
  const created = await prisma.clasificacionAbc.create({
    data: { idProducto: Number(idProducto), tipo },
  });
  return NextResponse.json(created, { status: 201 });
}
