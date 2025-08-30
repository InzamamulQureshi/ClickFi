// app/api/leaderboard/route.ts - FIXED VERSION

import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'current';

  try {
    let leaderboard;
    
    if (type === 'alltime') {
      const result = await pool.query(`
        SELECT username, total_earned as totalEarned
        FROM leaderboard_alltime
        ORDER BY total_earned DESC
        LIMIT 100
      `);
      leaderboard = result.rows;
    } else {
      const result = await pool.query(`
        SELECT username, score
        FROM leaderboard_current
        ORDER BY score DESC
        LIMIT 100
      `);
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