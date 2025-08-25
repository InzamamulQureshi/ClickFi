import { NextResponse } from "next/server";
import { getOrCreateUser, readDB, writeDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Body: { type: "multiplier" | "autoclick" | "crit", cost: number }
 * Cost is in score points (soft currency).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { type, cost } = body as { type?: string; cost?: number };

  if (!type || typeof cost !== "number" || cost <= 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await getOrCreateUser();
  const db = await readDB();
  const u = db.users[user.id];

  if (u.score < cost) {
    return NextResponse.json({ error: "Not enough points" }, { status: 400 });
  }

  u.score -= cost;
  if (type === "multiplier") u.boosters.multiplier = Math.min((u.boosters.multiplier || 1) + 1, 10);
  else if (type === "autoclick") u.boosters.autoclick = Math.min((u.boosters.autoclick || 0) + 1, 20);
  else if (type === "crit") u.boosters.critChance = Math.min((u.boosters.critChance || 0) + 0.05, 0.5);
  else return NextResponse.json({ error: "Unknown booster" }, { status: 400 });

  db.users[user.id] = u;
  await writeDB(db);
  return NextResponse.json({ user: u });
}
