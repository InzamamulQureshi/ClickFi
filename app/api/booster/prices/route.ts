// app/api/booster/prices/route.ts - FIXED VERSION

import { NextResponse } from "next/server";
import { getOrCreateUser, calculateBoosterNFTCost } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    
    // Calculate current levels and costs
    const multiplierLevel = user.boosters.multiplier - 1; // Level 0-based
    const autoclickLevel = user.boosters.autoclick;
    const critLevel = Math.floor(user.boosters.critChance * 20); // Convert 0-1 to 0-20 scale
    
    const prices = {
      multiplier: {
        current: user.boosters.multiplier,
        maxLevel: 10,
        cost: user.boosters.multiplier < 10 ? calculateBoosterNFTCost("multiplier", multiplierLevel) : null,
        nextLevel: user.boosters.multiplier < 10 ? user.boosters.multiplier + 1 : null,
        description: `${user.boosters.multiplier}x → ${Math.min(user.boosters.multiplier + 1, 10)}x click multiplier`
      },
      autoclick: {
        current: user.boosters.autoclick,
        maxLevel: 20,
        cost: user.boosters.autoclick < 20 ? calculateBoosterNFTCost("autoclick", autoclickLevel) : null,
        nextLevel: user.boosters.autoclick < 20 ? user.boosters.autoclick + 1 : null,
        description: `+${user.boosters.autoclick} → +${Math.min(user.boosters.autoclick + 1, 20)} points per click`
      },
      crit: {
        current: `${(user.boosters.critChance * 100).toFixed(1)}%`,
        maxLevel: "50.0%",
        cost: user.boosters.critChance < 0.5 ? calculateBoosterNFTCost("crit", critLevel) : null,
        nextLevel: user.boosters.critChance < 0.5 ? `${((user.boosters.critChance + 0.05) * 100).toFixed(1)}%` : null,
        description: `${(user.boosters.critChance * 100).toFixed(1)}% → ${Math.min((user.boosters.critChance + 0.05) * 100, 50).toFixed(1)}% critical hit chance (5x damage)`
      }
    };

    return NextResponse.json({
      prices,
      userNFTs: user.nfts,
      user: {
        boosters: user.boosters,
        nfts: user.nfts
      }
    });
  } catch (error) {
    console.error("Booster prices API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}