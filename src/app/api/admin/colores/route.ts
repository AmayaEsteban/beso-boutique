import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.color.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { nombre, hex } = body as { nombre: string; hex?: string | null };
  if (!nombre?.trim())
    return NextResponse.json({ error: "nombre requerido" }, { status: 400 });
  const created = await prisma.color.create({
    data: { nombre: nombre.trim(), hex: hex || null },
  });
  return NextResponse.json(created, { status: 201 });
}
