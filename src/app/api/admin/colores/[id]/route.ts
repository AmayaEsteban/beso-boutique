import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const body = await req.json();
  const updated = await prisma.color.update({
    where: { id },
    data: { nombre: body.nombre, hex: body.hex ?? null },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  await prisma.color.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
