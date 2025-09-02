import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

/**
 * DELETE /api/admin/clientes/:id
 * Elimina un cliente. (En tu schema, ventas.id_cliente tiene ON DELETE SET NULL,
 * por lo que no debería romper por FK; capturamos errores igualmente.)
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.cliente.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          (e as Error).message ||
          "Error al eliminar cliente (revise relaciones o ID).",
      },
      { status: 400 }
    );
  }
}
