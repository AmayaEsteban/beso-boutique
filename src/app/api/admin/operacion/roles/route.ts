import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ===== Tipos ===== */
type Dir = "asc" | "desc";
type OrderField = "id" | "nombre" | "fecha";

type RolDTO = {
  idRol: number;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: Date;
  usuariosCount: number;
  permisosCount: number;
};

const isDir = (v: string | null): v is Dir => v === "asc" || v === "desc";
const isOrder = (v: string | null): v is OrderField =>
  v === "id" || v === "nombre" || v === "fecha";

/* ======================= GET (listado) ======================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const orderParam = searchParams.get("order");
  const dirParam = searchParams.get("dir");

  const order: OrderField = isOrder(orderParam)
    ? (orderParam as OrderField)
    : "id";
  const dir: Dir = isDir(dirParam) ? (dirParam as Dir) : "desc";

  const where: Prisma.RolWhereInput = q
    ? {
        OR: [{ nombre: { contains: q } }, { descripcion: { contains: q } }],
      }
    : {};

  const orderBy: Prisma.RolOrderByWithRelationInput =
    order === "nombre"
      ? { nombre: dir }
      : order === "fecha"
      ? { fecha_creacion: dir }
      : { idRol: dir };

  const rows = await prisma.rol.findMany({
    where,
    orderBy,
    include: {
      usuarios: { select: { id: true } },
    },
  });

  // Count permisos por rol
  const ids = rows.map((r) => r.idRol);
  const permisosCounts = await prisma.$queryRaw<
    Array<{ id_rol: number; cnt: bigint }>
  >`SELECT id_rol, COUNT(*) AS cnt FROM roles_permisos WHERE id_rol IN (${Prisma.join(
    ids
  )}) GROUP BY id_rol`;

  const byRol: Record<number, number> = {};
  permisosCounts.forEach((r) => {
    byRol[r.id_rol] = Number(r.cnt);
  });

  const data: RolDTO[] = rows.map((r) => ({
    idRol: r.idRol,
    nombre: r.nombre,
    descripcion: r.descripcion ?? null,
    fecha_creacion: r.fecha_creacion,
    usuariosCount: r.usuarios.length,
    permisosCount: byRol[r.idRol] ?? 0,
  }));

  return NextResponse.json(data);
}

/* ======================= POST (crear) ======================= */
type CreateBody = {
  nombre: string;
  descripcion?: string | null;
};

export async function POST(req: Request) {
  const raw: unknown = await req.json();
  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const b = raw as CreateBody;

  if (!b.nombre || typeof b.nombre !== "string" || !b.nombre.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const created = await prisma.rol.create({
    data: {
      nombre: b.nombre.trim(),
      descripcion: b.descripcion?.trim() || null,
    },
  });

  const dto: RolDTO = {
    idRol: created.idRol,
    nombre: created.nombre,
    descripcion: created.descripcion ?? null,
    fecha_creacion: created.fecha_creacion,
    usuariosCount: 0,
    permisosCount: 0,
  };

  return NextResponse.json(dto, { status: 201 });
}
