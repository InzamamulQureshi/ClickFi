// Create: app/api/debug/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ 
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "Debug API is working"
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ 
      error: "Debug API failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}