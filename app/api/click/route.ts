import { NextResponse } from "next/server";
import { getOrCreateUser, readDB, writeDB, updateLeaderboard } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rollCrit(chance: number) {
  if (chance <= 0) return false;
  return Math.random() < chance;
}

export async function POST() {
  const user = await getOrCreateUser();
  const db = await readDB();
  const u = db.users[user.id];

  // base gain = 1 per click
  let gain = 1;

  // boosters:
  gain *= u.boosters.multiplier || 1;           // x2, x3, ...
  gain += u.boosters.autoclick || 0;            // extra passive per click call

  if (rollCrit(u.boosters.critChance || 0)) {
    gain *= 5; // crit = x5
  }

  u.score += Math.floor(gain);
  u.clicks += 1;

  db.users[user.id] = u;
  await writeDB(db);
  await updateLeaderboard(u);

  return NextResponse.json({ score: u.score, clicks: u.clicks, gain: Math.floor(gain) });
}
