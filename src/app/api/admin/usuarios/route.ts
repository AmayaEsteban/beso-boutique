import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validators/user";
import { hashPassword } from "@/lib/hash";
import type { Prisma, UsuariosEstado } from "@prisma/client";

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams;

  const qRaw = (searchParams.get("q") ?? "").trim();
  const estadoParam = (searchParams.get("estado") ?? "all") as
    | "all"
    | UsuariosEstado;
  const rolParam = (searchParams.get("rol") ?? "").trim();
  const orderParam = (searchParams.get("order") ?? "fecha_registro").trim();
  const dirParam = (searchParams.get("dir") ?? "desc").trim();

  const andClauses: Prisma.UsuarioWhereInput[] = [];

  if (qRaw) {
    andClauses.push({
      OR: [
        { nombre: { contains: qRaw } },
        { apellidos: { contains: qRaw } }, // <--- también en apellidos
        { email: { contains: qRaw } },
      ],
    });
  }

  if (
    estadoParam !== "all" &&
    (estadoParam === "activo" || estadoParam === "inactivo")
  ) {
    andClauses.push({ estado: estadoParam });
  }

  if (rolParam) {
    if (!Number.isNaN(Number(rolParam)))
      andClauses.push({ idRol: Number(rolParam) });
    else andClauses.push({ rol: { nombre: { equals: rolParam } } });
  }

  const where: Prisma.UsuarioWhereInput = andClauses.length
    ? { AND: andClauses }
    : {};

  const orderField: keyof Prisma.UsuarioOrderByWithRelationInput =
    orderParam === "nombre"
      ? "nombre"
      : orderParam === "id"
      ? "id"
      : "fecha_registro";

  const dir: "asc" | "desc" = dirParam === "asc" ? "asc" : "desc";

  const usuarios = await prisma.usuario.findMany({
    where,
    include: { rol: true },
    orderBy: { [orderField]: dir },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  try {
    const json = await req.json();

    // userCreateSchema valida nombre/email/idRol/estado/password
    const base = userCreateSchema.parse(json);

    const hashed = await hashPassword(base.password);

    const created = await prisma.usuario.create({
      data: {
        nombre: base.nombre,
        apellidos: json.apellidos ?? null, // <--- NUEVO
        email: base.email,
        password: hashed,
        idRol: base.idRol,
        estado: base.estado,
        dpi: json.dpi ?? null, // ya lo tenías previsto
        nit: json.nit ?? null,
        direccion: json.direccion ?? null,
      },
      include: { rol: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al crear usuario" },
      { status: 400 }
    );
  }
}
