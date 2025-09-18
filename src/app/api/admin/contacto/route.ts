// src/app/api/admin/contacto/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Sanitizadores / validadores simples */
const clean = (s: unknown) => (typeof s === "string" ? s.trim() : "");
const asNull = (s: string) => (s === "" ? null : s);

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isUrl = (s: string) => /^https?:\/\/[\w\-]+(\.[\w\-]+)+[^\s]*$/i.test(s);

/** GET: devuelve el registro (o {} si no existe aún) */
export async function GET() {
  const data = await prisma.contacto.findUnique({ where: { id: 1 } });
  return NextResponse.json(data ?? {});
}

/** PUT: actualiza (upsert si no existiera) */
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      telefono?: string | null;
      whatsapp?: string | null;
      email?: string | null;
      direccion?: string | null;
      facebook?: string | null;
      instagram?: string | null;
      tiktok?: string | null;
      horario?: string | null;
      mapaEmbed?: string | null;
    };

    // limpieza
    const telefono = asNull(clean(body.telefono));
    const whatsapp = asNull(clean(body.whatsapp));
    const email = asNull(clean(body.email));
    const direccion = asNull(clean(body.direccion));
    const facebook = asNull(clean(body.facebook));
    const instagram = asNull(clean(body.instagram));
    const tiktok = asNull(clean(body.tiktok));
    const horario = asNull(clean(body.horario));
    const mapaEmbed = asNull(clean(body.mapaEmbed));

    // validación ligera
    if (email && !isEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    for (const [label, value] of [
      ["Facebook", facebook],
      ["Instagram", instagram],
      ["TikTok", tiktok],
    ] as const) {
      if (value && !isUrl(value)) {
        return NextResponse.json(
          { error: `${label} debe ser URL http(s)` },
          { status: 400 }
        );
      }
    }

    const data = {
      telefono,
      whatsapp,
      email,
      direccion,
      facebook,
      instagram,
      tiktok,
      horario,
      mapaEmbed,
    };

    const updated = await prisma.contacto.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al guardar contacto" },
      { status: 400 }
    );
  }
}
