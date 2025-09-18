import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const isEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim().toLowerCase());

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const e = (email ?? "").trim().toLowerCase();
    if (!isEmail(e)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const existing = await prisma.suscriptorNewsletter.findUnique({
      where: { email: e },
    });

    if (existing) {
      if (!existing.activo) {
        await prisma.suscriptorNewsletter.update({
          where: { email: e },
          data: { activo: true },
        });
      }
      return NextResponse.json({ ok: true, message: "Ya estabas suscrito 😊" });
    }

    await prisma.suscriptorNewsletter.create({
      data: { email: e, activo: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al suscribir" },
      { status: 400 }
    );
  }
}
