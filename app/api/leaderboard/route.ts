import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'current'; // 'current' or 'alltime'

  const db = await readDB();
  
  if (type === 'alltime') {
    return NextResponse.json({ 
      leaderboard: db.alltimeLeaderboard || [],
      type: 'alltime'
    });
  }
  
  return NextResponse.json({ 
    leaderboard: db.leaderboard || [],
    type: 'current'
  });
}