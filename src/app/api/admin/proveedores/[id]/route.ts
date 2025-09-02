import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const { nombre, contacto, telefono, correo, direccion } =
    (await req.json()) as {
      nombre?: string;
      contacto?: string | null;
      telefono?: string | null;
      correo?: string | null;
      direccion?: string | null;
    };

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "nombre requerido" }, { status: 400 });
  }

  const updated = await prisma.proveedor.update({
    where: { id },
    data: {
      nombre: nombre.trim(),
      contacto: contacto?.trim() || null,
      telefono: telefono?.trim() || null,
      correo: correo?.trim() || null,
      direccion: direccion?.trim() || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  await prisma.proveedor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
