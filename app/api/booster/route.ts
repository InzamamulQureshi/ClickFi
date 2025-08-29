import { NextResponse } from "next/server";
import { getOrCreateUser, readDB, writeDB, calculateBoosterNFTCost } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Body: { type: "multiplier" | "autoclick" | "crit" }
 * Cost is now in NFTs, not points!
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { type } = body as { type?: string };

  if (!type || !["multiplier", "autoclick", "crit"].includes(type)) {
    return NextResponse.json({ error: "Invalid booster type" }, { status: 400 });
  }

  const user = await getOrCreateUser();
  const db = await readDB();
  const u = db.users[user.id];

  // Ensure user has all required fields
  if (!u.boosters) {
    u.boosters = { multiplier: 1, autoclick: 0, critChance: 0 };
  }
  if (typeof u.totalEarned !== 'number') {
    u.totalEarned = u.score;
  }

  // Calculate current cost in NFTs based on existing level
  let currentLevel = 0;
  if (type === "multiplier") currentLevel = u.boosters.multiplier - 1; // Start from 0 since base is 1
  else if (type === "autoclick") currentLevel = u.boosters.autoclick;
  else if (type === "crit") currentLevel = Math.floor(u.boosters.critChance * 20); // Convert 0.05 increments to level

  const nftCost = calculateBoosterNFTCost(type as "multiplier" | "autoclick" | "crit", currentLevel);

  // Check if user has enough NFTs
  if (u.nfts < nftCost) {
    return NextResponse.json({ 
      error: `Not enough NFTs. Need ${nftCost} NFT${nftCost > 1 ? 's' : ''}, you have ${u.nfts}`, 
      nftCost,
      userNFTs: u.nfts 
    }, { status: 400 });
  }

  // Check max levels
  const maxLevels = { multiplier: 10, autoclick: 20, crit: 0.5 };
  if ((type === "multiplier" && u.boosters.multiplier >= maxLevels.multiplier) ||
      (type === "autoclick" && u.boosters.autoclick >= maxLevels.autoclick) ||
      (type === "crit" && u.boosters.critChance >= maxLevels.crit)) {
    return NextResponse.json({ error: "Maximum level reached for this booster" }, { status: 400 });
  }

  // Apply the upgrade - spend NFTs instead of points!
  u.nfts -= nftCost;
  
  if (type === "multiplier") {
    u.boosters.multiplier = Math.min(u.boosters.multiplier + 1, maxLevels.multiplier);
  } else if (type === "autoclick") {
    u.boosters.autoclick = Math.min(u.boosters.autoclick + 1, maxLevels.autoclick);
  } else if (type === "crit") {
    u.boosters.critChance = Math.min(u.boosters.critChance + 0.05, maxLevels.crit);
  }

  db.users[user.id] = u;
  await writeDB(db);

  return NextResponse.json({ 
    user: u, 
    nftCost,
    nextNFTCost: calculateBoosterNFTCost(type as "multiplier" | "autoclick" | "crit", currentLevel + 1)
  });
}