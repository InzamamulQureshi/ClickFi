import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateUser();
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  const { username } = await req.json().catch(() => ({ username: undefined }));
  const user = await getOrCreateUser(username);
  return NextResponse.json({ user });
}
