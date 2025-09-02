import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const { codigo, orden } = await req.json();
  const updated = await prisma.talla.update({
    where: { id },
    data: { codigo, orden: Number(orden) || 0 },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  await prisma.talla.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
