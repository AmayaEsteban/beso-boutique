import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UsuariosEstado } from "@prisma/client";

type Params = { params: { id: string } };

/**
 * PUT /api/admin/usuarios/:id
 * Body: { nombre, email, idRol, estado, password? }
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const data = await req.json();

    const updated = await prisma.usuario.update({
      where: { id },
      data: {
        nombre: data.nombre,
        email: data.email,
        idRol: Number(data.idRol),
        estado: data.estado as UsuariosEstado,
        ...(data.password ? { password: data.password } : {}),
      },
      include: { rol: true },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error desconocido al actualizar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/**
 * PATCH /api/admin/usuarios/:id
 * Body: { estado: "activo" | "inactivo" }
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { estado } = (await req.json()) as { estado: UsuariosEstado };

    const updated = await prisma.usuario.update({
      where: { id },
      data: { estado },
      include: { rol: true },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error desconocido al cambiar estado";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/usuarios/:id
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Error desconocido al eliminar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
