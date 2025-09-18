// src/app/api/public/paginas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pages = await prisma.paginaCMS.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    select: { id: true, slug: true, titulo: true },
  });
  return NextResponse.json(pages);
}
