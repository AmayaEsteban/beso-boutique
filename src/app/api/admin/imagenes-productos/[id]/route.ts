import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const { url, alt, orden } = await req.json();
  const updated = await prisma.productoImagen.update({
    where: { id },
    data: { url, alt: alt ?? null, orden: Number(orden) || 0 },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.productoImagen.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
