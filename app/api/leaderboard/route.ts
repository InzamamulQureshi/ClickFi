import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await readDB();
  return NextResponse.json({ leaderboard: db.leaderboard });
}
