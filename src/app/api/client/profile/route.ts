import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Este endpoint actualiza telefono/direccion en `clientes`
 * y también actualiza `usuarios.direccion` si te sirve mantenerlo sincronizado.
 *
 * Para producción: obtén el email/ID del usuario desde la sesión JWT.
 */
function sanitize(body: unknown) {
  const b = body as Record<string, unknown>;
  // Temporal: recibimos el email del usuario autenticado
  const email = String(b?.email ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Email requerido.");

  const telefono = String(b?.telefono ?? "").trim();
  const direccion = String(b?.direccion ?? "").trim();

  return {
    email,
    telefono: telefono.length ? telefono : null,
    direccion: direccion.length ? direccion : null,
  };
}

export async function PATCH(req: Request) {
  try {
    const raw = await req.json();
    const { email, telefono, direccion } = sanitize(raw);

    // Transacción: upsert cliente por email + update usuario (si existe)
    const result = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.upsert({
        where: { email },
        update: { telefono, direccion },
        create: {
          email,
          nombre: "", // si llega alguien sin registro previo (raro), lo creamos vacío
          telefono,
          direccion,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          direccion: true,
          fecha_registro: true,
        },
      });

      // Si existe usuario con ese email, sincroniza dirección
      const usuario = await tx.usuario.findUnique({
        where: { email },
        select: { id: true },
      });
      if (usuario) {
        await tx.usuario.update({
          where: { email },
          data: { direccion },
          select: { id: true },
        });
      }

      return { cliente };
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Error al guardar datos del cliente." },
      { status: 400 }
    );
  }
}
