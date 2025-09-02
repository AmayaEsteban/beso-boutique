// src/app/api/admin/proveedores/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Dir = "asc" | "desc";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const order = (searchParams.get("order") ?? "id").toLowerCase();
  const dir: Dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const where: Prisma.ProveedorWhereInput | undefined =
    q.length > 0
      ? {
          OR: [
            { nombre: { contains: q } },
            { contacto: { contains: q } },
            { telefono: { contains: q } },
            { correo: { contains: q } },
          ],
        }
      : undefined;

  // 🔧 Nota: el _count debe usar los nombres de relación EXACTOS del schema:
  // compras: Compra[]
  // DevolucionProveedor: DevolucionProveedor[]
  type ProveedorWithCounts = Prisma.ProveedorGetPayload<{
    include: {
      _count: { select: { compras: true; DevolucionProveedor: true } };
    };
  }>;

  const data: ProveedorWithCounts[] = await prisma.proveedor.findMany({
    where,
    orderBy: order === "id" ? { id: dir } : { nombre: dir },
    include: {
      _count: {
        select: {
          compras: true,
          DevolucionProveedor: true,
        },
      },
    },
  });

  // Normalizamos el nombre para tu UI: devoluciones := _count.DevolucionProveedor
  const normalized = data.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    contacto: p.contacto,
    telefono: p.telefono,
    correo: p.correo,
    direccion: p.direccion,
    _count: {
      compras: p._count.compras,
      devoluciones: p._count.DevolucionProveedor,
    },
  }));

  return NextResponse.json(normalized);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    nombre?: string;
    contacto?: string | null;
    telefono?: string | null;
    correo?: string | null;
    direccion?: string | null;
  };

  const nombre = (body.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "nombre requerido" }, { status: 400 });
  }

  const created = await prisma.proveedor.create({
    data: {
      nombre,
      contacto: body.contacto?.trim() || null,
      telefono: body.telefono?.trim() || null,
      correo: body.correo?.trim() || null,
      direccion: body.direccion?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
