import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const p = await prisma.pagoProveedor.findUnique({
    where: { id },
    include: {
      compra: { select: { id: true, proveedor: { select: { nombre: true } } } },
    },
  });
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({
    id: p.id,
    idCompra: p.idCompra,
    monto: Number(p.monto),
    metodo: p.metodo,
    referencia: p.referencia,
    fecha: p.fecha.toISOString(),
    nota: p.nota,
    compra: { id: p.compra.id, proveedor: p.compra.proveedor?.nombre ?? null },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  await prisma.pagoProveedor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
