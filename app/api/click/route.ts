// app/api/click/route.ts - VERCEL POSTGRES VERSION

import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db";
import { sql } from '@vercel/postgres';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rollCrit(chance: number) {
  if (chance <= 0) return false;
  return Math.random() < chance;
}

export async function POST() {
  try {
    const user = await getOrCreateUser();
    
    // Calculate gain
    let gain = 1;
    gain *= user.boosters.multiplier || 1;
    gain += user.boosters.autoclick || 0;

    if (rollCrit(user.boosters.critChance || 0)) {
      gain *= 5; // crit = x5
    }

    const finalGain = Math.floor(gain);
    
    // Update user in database
    const newScore = user.score + finalGain;
    const newTotalEarned = user.totalEarned + finalGain;
    const newClicks = user.clicks + 1;

    await sql`
      UPDATE users 
      SET score = ${newScore}, clicks = ${newClicks}, total_earned = ${newTotalEarned}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    // Update leaderboards
    await sql`
      INSERT INTO leaderboard_current (id, username, score)
      VALUES (${user.id}, ${user.username}, ${newScore})
      ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      score = EXCLUDED.score,
      updated_at = CURRENT_TIMESTAMP
    `;
    
    await sql`
      INSERT INTO leaderboard_alltime (id, username, total_earned)
      VALUES (${user.id}, ${user.username}, ${newTotalEarned})
      ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      total_earned = EXCLUDED.total_earned,
      updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ 
      score: newScore, 
      clicks: newClicks, 
      gain: finalGain,
      totalEarned: newTotalEarned
    });
  } catch (error) {
    console.error("Click API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}