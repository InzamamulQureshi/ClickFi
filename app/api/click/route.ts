import { NextResponse } from "next/server";
import { getOrCreateUser, readDB, writeDB, updateLeaderboard } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rollCrit(chance: number) {
  if (chance <= 0) return false;
  return Math.random() < chance;
}

export async function POST() {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const db = await readDB();
    let u = db.users[user.id];
    
    // If user doesn't exist in DB, create them
    if (!u) {
      u = {
        id: user.id,
        username: user.username,
        score: 0,
        clicks: 0,
        boosters: { multiplier: 1, autoclick: 0, critChance: 0 },
        nfts: 0,
        totalEarned: 0, // Initialize new field
      };
      db.users[user.id] = u;
    }

    // Ensure all fields exist (for migration)
    if (!u.boosters) {
      u.boosters = { multiplier: 1, autoclick: 0, critChance: 0 };
    }
    if (typeof u.totalEarned !== 'number') {
      u.totalEarned = u.score; // Approximate for existing users
    }

    // base gain = 1 per click
    let gain = 1;

    // boosters:
    gain *= u.boosters.multiplier || 1;           // x2, x3, ...
    gain += u.boosters.autoclick || 0;            // extra passive per click call

    if (rollCrit(u.boosters.critChance || 0)) {
      gain *= 5; // crit = x5
    }

    const finalGain = Math.floor(gain);
    
    u.score += finalGain;
    u.totalEarned += finalGain; // Track total earnings
    u.clicks += 1;

    db.users[user.id] = u;
    await writeDB(db);
    await updateLeaderboard(u);

    return NextResponse.json({ 
      score: u.score, 
      clicks: u.clicks, 
      gain: finalGain,
      totalEarned: u.totalEarned
    });
  } catch (error) {
    console.error("Click API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}