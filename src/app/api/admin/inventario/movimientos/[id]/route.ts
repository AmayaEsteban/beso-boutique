import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MovTipo = "ingreso" | "egreso" | "ajuste";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const res = await prisma.$transaction(async (tx) => {
    const mov = await tx.inventarioMovimiento.findUnique({
      where: { id },
      select: {
        id: true,
        idProducto: true,
        idVariante: true,
        tipo: true,
        cantidad: true,
      },
    });
    if (!mov) throw new Error("Movimiento no encontrado");
    if (mov.tipo === "ajuste")
      throw new Error("No se puede eliminar un ajuste");

    // Reversa
    if (mov.idVariante !== null) {
      const v = await tx.productoVariante.findUnique({
        where: { id: mov.idVariante },
        select: { stock: true },
      });
      if (!v) throw new Error("Variante no encontrada");
      let nuevo = v.stock;
      if (mov.tipo === "ingreso") {
        // revertir suma
        if (v.stock - mov.cantidad < 0)
          throw new Error("Stock insuficiente para revertir");
        nuevo = v.stock - mov.cantidad;
      } else if (mov.tipo === "egreso") {
        nuevo = v.stock + mov.cantidad;
      }
      await tx.productoVariante.update({
        where: { id: mov.idVariante },
        data: { stock: nuevo },
      });
    } else {
      const p = await tx.producto.findUnique({
        where: { id: mov.idProducto },
        select: { stock: true },
      });
      if (!p) throw new Error("Producto no encontrado");
      let nuevo = p.stock;
      if (mov.tipo === "ingreso") {
        if (p.stock - mov.cantidad < 0)
          throw new Error("Stock insuficiente para revertir");
        nuevo = p.stock - mov.cantidad;
      } else if (mov.tipo === "egreso") {
        nuevo = p.stock + mov.cantidad;
      }
      await tx.producto.update({
        where: { id: mov.idProducto },
        data: { stock: nuevo },
      });
    }

    await tx.inventarioMovimiento.delete({ where: { id } });
    return { ok: true };
  });

  return NextResponse.json(res);
}
