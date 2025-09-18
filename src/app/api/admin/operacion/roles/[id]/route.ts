import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

type UpdateBody = {
  nombre?: string;
  descripcion?: string | null;
};

function toId(s: string): number | null {
  const n = Number.parseInt(s, 10);
  return Number.isInteger(n) ? n : null;
}

/* ======================= PUT (actualizar) ======================= */
export async function PUT(req: Request, { params }: Params) {
  const id = toId(params.id);
  if (id === null)
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const raw: unknown = await req.json();
  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const b = raw as UpdateBody;

  const data: { nombre?: string; descripcion?: string | null } = {};
  if (typeof b.nombre === "string" && b.nombre.trim())
    data.nombre = b.nombre.trim();
  if (typeof b.descripcion !== "undefined")
    data.descripcion = b.descripcion?.trim() || null;

  const updated = await prisma.rol.update({
    where: { idRol: id },
    data,
  });

  return NextResponse.json({
    idRol: updated.idRol,
    nombre: updated.nombre,
    descripcion: updated.descripcion ?? null,
    fecha_creacion: updated.fecha_creacion,
  });
}

/* ======================= DELETE (eliminar) ======================= */
export async function DELETE(_req: Request, { params }: Params) {
  const id = toId(params.id);
  if (id === null)
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Evita borrar si hay usuarios asignados
  const count = await prisma.usuario.count({ where: { idRol: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: hay usuarios con este rol." },
      { status: 409 }
    );
  }

  await prisma.rol.delete({ where: { idRol: id } });
  return NextResponse.json({ ok: true });
}
