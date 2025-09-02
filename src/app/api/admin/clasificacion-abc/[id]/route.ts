import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const { tipo } = await req.json();
  if (!["A", "B", "C"].includes(tipo))
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  const updated = await prisma.clasificacionAbc.update({
    where: { id },
    data: { tipo },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.clasificacionAbc.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
