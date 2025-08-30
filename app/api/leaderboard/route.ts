// app/api/leaderboard/route.ts - VERCEL POSTGRES VERSION

import { NextResponse } from "next/server";
import { sql } from '@vercel/postgres';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'current';

  try {
    let leaderboard;
    
    if (type === 'alltime') {
      const result = await sql`
        SELECT username, total_earned as totalEarned
        FROM leaderboard_alltime
        ORDER BY total_earned DESC
        LIMIT 100
      `;
      leaderboard = result.rows;
    } else {
      const result = await sql`
        SELECT username, score
        FROM leaderboard_current
        ORDER BY score DESC
        LIMIT 100
      `;
      leaderboard = result.rows;
    }
    
    return NextResponse.json({ 
      leaderboard,
      type
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}