// src/app/api/auth/status/route.ts
import { NextResponse } from "next/server";
import { getIsLoggedInServer } from "@/lib/auth";

export async function GET() {
  const loggedIn = await getIsLoggedInServer();
  return NextResponse.json({ loggedIn });
}
