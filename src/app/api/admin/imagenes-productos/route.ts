import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idProducto = searchParams.get("idProducto");
  const q = (searchParams.get("q") ?? "").trim();
  const dir = (searchParams.get("dir") as "asc" | "desc") ?? "asc";

  const data = await prisma.productoImagen.findMany({
    where: {
      ...(idProducto ? { idProducto: Number(idProducto) } : {}),
      ...(q
        ? {
            OR: [{ url: { contains: q } }, { alt: { contains: q } }],
          }
        : {}),
    },
    orderBy: [{ idProducto: "asc" }, { orden: dir }, { id: "asc" }],
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { idProducto, url, alt, orden } = await req.json();
  if (!idProducto || !url)
    return NextResponse.json(
      { error: "idProducto y url requeridos" },
      { status: 400 }
    );
  const created = await prisma.productoImagen.create({
    data: {
      idProducto: Number(idProducto),
      url: String(url),
      alt: alt || null,
      orden: Number(orden) || 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
