// app/api/booster/route.ts - VERCEL POSTGRES VERSION

import { NextResponse } from "next/server";
import { getOrCreateUser, calculateBoosterNFTCost } from "@/lib/db";
import { sql } from '@vercel/postgres';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { type } = body as { type?: string };

  if (!type || !["multiplier", "autoclick", "crit"].includes(type)) {
    return NextResponse.json({ error: "Invalid booster type" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser();

    // Calculate current level and cost
    let currentLevel = 0;
    if (type === "multiplier") currentLevel = user.boosters.multiplier - 1;
    else if (type === "autoclick") currentLevel = user.boosters.autoclick;
    else if (type === "crit") currentLevel = Math.floor(user.boosters.critChance * 20);

    const nftCost = calculateBoosterNFTCost(type as "multiplier" | "autoclick" | "crit", currentLevel);

    // Check if user has enough NFTs
    if (user.nfts < nftCost) {
      return NextResponse.json({ 
        error: `Not enough NFTs. Need ${nftCost} NFT${nftCost > 1 ? 's' : ''}, you have ${user.nfts}`, 
        nftCost,
        userNFTs: user.nfts 
      }, { status: 400 });
    }

    // Check max levels
    const maxLevels = { multiplier: 10, autoclick: 20, crit: 0.5 };
    if ((type === "multiplier" && user.boosters.multiplier >= maxLevels.multiplier) ||
        (type === "autoclick" && user.boosters.autoclick >= maxLevels.autoclick) ||
        (type === "crit" && user.boosters.critChance >= maxLevels.crit)) {
      return NextResponse.json({ error: "Maximum level reached for this booster" }, { status: 400 });
    }

    // Calculate new values
    const newNFTs = user.nfts - nftCost;
    let newMultiplier = user.boosters.multiplier;
    let newAutoclick = user.boosters.autoclick;
    let newCritChance = user.boosters.critChance;
    
    if (type === "multiplier") {
      newMultiplier = Math.min(user.boosters.multiplier + 1, maxLevels.multiplier);
    } else if (type === "autoclick") {
      newAutoclick = Math.min(user.boosters.autoclick + 1, maxLevels.autoclick);
    } else if (type === "crit") {
      newCritChance = Math.min(user.boosters.critChance + 0.05, maxLevels.crit);
    }

    // Update user in database
    await sql`
      UPDATE users 
      SET nfts = ${newNFTs}, multiplier = ${newMultiplier}, autoclick = ${newAutoclick}, crit_chance = ${newCritChance}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    // Return updated user data
    const updatedUser = {
      ...user,
      nfts: newNFTs,
      boosters: {
        multiplier: newMultiplier,
        autoclick: newAutoclick,
        critChance: newCritChance
      }
    };

    return NextResponse.json({ 
      user: updatedUser, 
      nftCost,
      nextNFTCost: calculateBoosterNFTCost(type as "multiplier" | "autoclick" | "crit", currentLevel + 1)
    });
  } catch (error) {
    console.error("Booster API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}