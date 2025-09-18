import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export type PermisoModulo = {
  modulo: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
};

function toId(s: string): number | null {
  const n = Number.parseInt(s, 10);
  return Number.isInteger(n) ? n : null;
}

/* ============== GET: permisos del rol ============== */
export async function GET(_req: Request, { params }: Params) {
  const idRol = toId(params.id);
  if (idRol === null)
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const rows = await prisma.$queryRaw<
    Array<{
      modulo: string;
      puede_ver: number;
      puede_crear: number;
      puede_editar: number;
      puede_eliminar: number;
    }>
  >`SELECT modulo, puede_ver, puede_crear, puede_editar, puede_eliminar
    FROM roles_permisos WHERE id_rol = ${idRol}`;

  const data: PermisoModulo[] = rows.map((r) => ({
    modulo: r.modulo,
    puede_ver: !!r.puede_ver,
    puede_crear: !!r.puede_crear,
    puede_editar: !!r.puede_editar,
    puede_eliminar: !!r.puede_eliminar,
  }));

  return NextResponse.json(data);
}

/* ============== PUT: reemplazar set de permisos ============== */
export async function PUT(req: Request, { params }: Params) {
  const idRol = toId(params.id);
  if (idRol === null)
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const raw: unknown = await req.json();
  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: "Se espera un arreglo de permisos" },
      { status: 400 }
    );
  }

  // Validación ligera
  const incoming: PermisoModulo[] = raw
    .map((r): PermisoModulo | null => {
      if (!r || typeof r !== "object") return null;
      const o = r as Record<string, unknown>;
      const modulo =
        typeof o.modulo === "string" && o.modulo.trim()
          ? o.modulo.trim().slice(0, 60)
          : null;
      if (!modulo) return null;
      const bool = (v: unknown) => v === true || v === 1 || v === "1";
      return {
        modulo,
        puede_ver: bool(o.puede_ver),
        puede_crear: bool(o.puede_crear),
        puede_editar: bool(o.puede_editar),
        puede_eliminar: bool(o.puede_eliminar),
      };
    })
    .filter((x): x is PermisoModulo => x !== null);

  // Reemplazo total por simplicidad/consistencia
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `DELETE FROM roles_permisos WHERE id_rol = ${idRol}`
    );
    if (incoming.length === 0) return;

    const values = incoming
      .map(
        (p) =>
          `(${idRol}, ${tx.$queryRaw`CAST(${p.puede_ver} AS UNSIGNED)`}, ${tx.$queryRaw`CAST(${p.puede_crear} AS UNSIGNED)`}, ${tx.$queryRaw`CAST(${p.puede_editar} AS UNSIGNED)`}, ${tx.$queryRaw`CAST(${p.puede_eliminar} AS UNSIGNED)`}, ${tx.$queryRaw`${p.modulo}`})`
      )
      .join(",");

    // Inserción segura (usamos parámetros en loop si tu motor no permite concatenación)
    for (const p of incoming) {
      await tx.$executeRaw`
        INSERT INTO roles_permisos (id_rol, puede_ver, puede_crear, puede_editar, puede_eliminar, modulo)
        VALUES (${idRol}, ${p.puede_ver ? 1 : 0}, ${p.puede_crear ? 1 : 0}, ${
        p.puede_editar ? 1 : 0
      }, ${p.puede_eliminar ? 1 : 0}, ${p.modulo})
      `;
    }
  });

  return NextResponse.json({ ok: true });
}
