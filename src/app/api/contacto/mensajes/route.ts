import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Crea un mensaje de contacto desde la página pública */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      nombre?: string;
      email?: string;
      telefono?: string | null;
      asunto?: string | null;
      mensaje?: string;
    };

    const nombre = (body.nombre ?? "").trim();
    const email = (body.email ?? "").trim();
    const telefono = (body.telefono ?? "").trim() || null;
    const asunto = (body.asunto ?? "").trim() || null;
    const mensaje = (body.mensaje ?? "").trim();

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio." },
        { status: 400 }
      );
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }
    if (!mensaje) {
      return NextResponse.json(
        { error: "El mensaje es obligatorio." },
        { status: 400 }
      );
    }

    const created = await prisma.mensajeContacto.create({
      data: { nombre, email, telefono, asunto, mensaje },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "No se pudo crear el mensaje" },
      { status: 400 }
    );
  }
}
