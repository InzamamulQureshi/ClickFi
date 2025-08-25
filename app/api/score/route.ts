import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateUser();
  return NextResponse.json({ score: user.score, user });
}
