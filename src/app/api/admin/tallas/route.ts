import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.talla.findMany({
    orderBy: [{ orden: "asc" }, { id: "asc" }],
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { codigo, orden } = await req.json();
  if (!codigo?.trim())
    return NextResponse.json({ error: "codigo requerido" }, { status: 400 });
  const created = await prisma.talla.create({
    data: { codigo: codigo.trim(), orden: Number(orden) || 0 },
  });
  return NextResponse.json(created, { status: 201 });
}
