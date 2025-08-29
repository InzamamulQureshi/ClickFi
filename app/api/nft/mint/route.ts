import { NextResponse } from "next/server";
import { getOrCreateUser, readDB, writeDB, getRemainingMints } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Free NFT minting with daily limits:
 * - FREE but limited to 5 mints per day
 * - Must spend points in multiples of 1000
 * - NFTs are used to buy power-ups in the shop
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({ pointsToSpend: 1000 }));
  const { pointsToSpend } = body as { pointsToSpend?: number };

  // Validate points to spend (must be multiple of 1000)
  if (!pointsToSpend || pointsToSpend < 1000 || pointsToSpend % 1000 !== 0) {
    return NextResponse.json({ 
      error: "Points to spend must be a multiple of 1000 (e.g., 1000, 2000, 3000, etc.)" 
    }, { status: 400 });
  }
  
  const user = await getOrCreateUser();
  const db = await readDB();
  const u = db.users[user.id];

  // Ensure user has all required fields
  if (typeof u.totalEarned !== 'number') {
    u.totalEarned = u.score;
  }
  if (typeof u.dailyMints !== 'number') {
    u.dailyMints = 0;
  }
  if (!u.lastMintDate) {
    u.lastMintDate = new Date().toISOString().split('T')[0];
  }

  // Check daily mint limit
  const remainingMints = getRemainingMints(u);
  if (remainingMints <= 0) {
    return NextResponse.json({ 
      error: "Daily mint limit reached. Come back tomorrow!",
      remainingMints: 0,
      nextResetTime: "24 hours"
    }, { status: 400 });
  }

  // Check if user has enough points to spend
  if (u.score < pointsToSpend) {
    return NextResponse.json({ 
      error: "Not enough points",
      required: pointsToSpend,
      current: u.score
    }, { status: 400 });
  }

  // Calculate NFTs earned (1 NFT per 1000 points spent)
  const nftsToEarn = pointsToSpend / 1000;

  // Spend the points and earn NFTs
  u.score -= pointsToSpend;
  u.nfts += nftsToEarn;
  u.dailyMints += 1;
  u.lastMintDate = new Date().toISOString().split('T')[0];

  db.users[user.id] = u;
  await writeDB(db);

  // Generate mock tokens
  const tokens = [];
  for (let i = 0; i < nftsToEarn; i++) {
    const tokenId = `${u.id.slice(0, 6)}-${u.nfts - nftsToEarn + i + 1}`;
    const image = `https://api.dicebear.com/8.x/shapes/svg?seed=${tokenId}`;
    tokens.push({ tokenId, image });
  }

  return NextResponse.json({ 
    success: true, 
    tokens,
    nftsEarned: nftsToEarn,
    pointsSpent: pointsToSpend,
    remainingMints: getRemainingMints(u),
    user: u 
  });
}