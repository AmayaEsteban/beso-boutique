import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import type { Prisma, UsuariosEstado } from "@prisma/client";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = (await req.json()) as {
      nombre?: string;
      apellidos?: string | null; // <--- NUEVO
      email?: string;
      idRol?: number;
      estado?: UsuariosEstado;
      password?: string;
      dpi?: string | null;
      nit?: string | null;
      direccion?: string | null;
    };

    const data: Prisma.UsuarioUpdateInput = {
      ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
      ...(body.apellidos !== undefined ? { apellidos: body.apellidos } : {}), // <---
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(typeof body.idRol === "number" ? { idRol: body.idRol } : {}),
      ...(body.estado ? { estado: body.estado } : {}),
      ...(body.password ? { password: await hashPassword(body.password) } : {}),
      ...(body.dpi !== undefined ? { dpi: body.dpi } : {}),
      ...(body.nit !== undefined ? { nit: body.nit } : {}),
      ...(body.direccion !== undefined ? { direccion: body.direccion } : {}),
    };

    const updated = await prisma.usuario.update({
      where: { id },
      data,
      include: { rol: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al actualizar" },
      { status: 400 }
    );
  }
}

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
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al cambiar estado" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al eliminar" },
      { status: 400 }
    );
  }
}
