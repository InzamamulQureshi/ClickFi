import { NextResponse } from "next/server";
import { getOrCreateUser, calculateBoosterNFTCost, getRemainingMints } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET endpoint to fetch current booster costs in NFTs for the user
 */
export async function GET() {
  try {
    const user = await getOrCreateUser();
    
    // Calculate current levels
    const multiplierLevel = user.boosters.multiplier - 1; // Base is 1, so level 0 = multiplier 1
    const autoclickLevel = user.boosters.autoclick;
    const critLevel = Math.floor(user.boosters.critChance * 20); // 0.05 increments = level

    const nftCosts = {
      multiplier: calculateBoosterNFTCost("multiplier", multiplierLevel),
      autoclick: calculateBoosterNFTCost("autoclick", autoclickLevel),
      crit: calculateBoosterNFTCost("crit", critLevel)
    };

    return NextResponse.json({ 
      nftCosts,
      levels: {
        multiplier: user.boosters.multiplier,
        autoclick: user.boosters.autoclick,
        critChance: user.boosters.critChance
      },
      maxLevels: {
        multiplier: 10,
        autoclick: 20,
        critChance: 0.5
      },
      userNFTs: user.nfts,
      dailyMints: {
        used: user.dailyMints,
        remaining: getRemainingMints(user),
        total: 5
      }
    });
  } catch (error) {
    console.error("Booster prices API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}