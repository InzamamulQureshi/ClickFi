// app/api/nft/mint/route.ts - FIXED VERSION

import { NextResponse } from "next/server";
import { getOrCreateUser, getRemainingMints } from "@/lib/db";
import { sql } from '@vercel/postgres';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getOrCreateUser();
    const remainingMints = getRemainingMints(user);
    
    if (remainingMints <= 0) {
      return NextResponse.json({ 
        error: "No mints remaining today. Daily limit: 5 NFTs" 
      }, { status: 400 });
    }

    // Cost: 10k points per NFT
    const mintCost = 10000;
    if (user.score < mintCost) {
      return NextResponse.json({ 
        error: `Not enough points. Need ${mintCost.toLocaleString()}, you have ${user.score.toLocaleString()}` 
      }, { status: 400 });
    }

    // Process the mint
    const newScore = user.score - mintCost;
    const newNFTs = user.nfts + 1;
    const newDailyMints = user.dailyMints + 1;

    // Update user in database
    await sql`
      UPDATE users 
      SET score = ${newScore}, nfts = ${newNFTs}, daily_mints = ${newDailyMints}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    // Update leaderboards
    await sql`
      INSERT INTO leaderboard_current (id, username, score)
      VALUES (${user.id}, ${user.username}, ${newScore})
      ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      score = EXCLUDED.score,
      updated_at = CURRENT_TIMESTAMP
    `;

    // Generate mock NFT data
    const tokens = [];
    for (let i = 0; i < 1; i++) {
      const rarity = Math.random();
      let rarityName = "Common";
      let color = "#64748b";
      
      if (rarity > 0.95) {
        rarityName = "Legendary";
        color = "#fbbf24";
      } else if (rarity > 0.85) {
        rarityName = "Epic";
        color = "#8b5cf6";
      } else if (rarity > 0.65) {
        rarityName = "Rare";
        color = "#3b82f6";
      } else if (rarity > 0.35) {
        rarityName = "Uncommon";
        color = "#10b981";
      }

      tokens.push({
        id: `monad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Monad ${rarityName} #${Math.floor(Math.random() * 10000)}`,
        rarity: rarityName,
        color: color,
        image: `https://api.dicebear.com/7.x/shapes/svg?seed=${Math.random()}&backgroundColor=${color.slice(1)}`
      });
    }

    return NextResponse.json({ 
      success: true,
      tokens,
      user: {
        ...user,
        score: newScore,
        nfts: newNFTs,
        dailyMints: newDailyMints
      },
      remainingMints: remainingMints - 1,
      message: `Successfully minted ${tokens.length} NFT${tokens.length > 1 ? 's' : ''}!`
    });

  } catch (error) {
    console.error("NFT mint error:", error);
    return NextResponse.json({ 
      error: "Failed to mint NFT. Please try again." 
    }, { status: 500 });
  }
}