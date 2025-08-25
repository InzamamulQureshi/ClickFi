import { NextResponse } from "next/server";
import { getOrCreateUser, readDB, writeDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mock NFT mint:
 * - Costs 1,000 points (soft currency) by default
 * - Increments user's `nfts` count
 * - Returns a fake tokenId and image URL
 */
export async function POST(req: Request) {
  const { cost } = await req.json().catch(() => ({ cost: 1000 }));
  const user = await getOrCreateUser();
  const db = await readDB();
  const u = db.users[user.id];

  const price = typeof cost === "number" && cost > 0 ? cost : 1000;

  if (u.score < price) {
    return NextResponse.json({ error: "Not enough points" }, { status: 400 });
  }

  u.score -= price;
  u.nfts += 1;

  db.users[user.id] = u;
  await writeDB(db);

  // mock token
  const tokenId = `${u.id.slice(0, 6)}-${u.nfts}`;
  const image = `https://api.dicebear.com/8.x/shapes/svg?seed=${tokenId}`;

  return NextResponse.json({ success: true, tokenId, image, user: u });
}
