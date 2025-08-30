// lib/db.ts - FOR VERCEL POSTGRES

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { sql } from '@vercel/postgres';

type BoosterState = {
  multiplier: number;
  autoclick: number;
  critChance: number;
};

export type UserRow = {
  id: string;
  username: string;
  score: number;
  clicks: number;
  boosters: BoosterState;
  nfts: number;
  totalEarned: number;
  dailyMints: number;
  lastMintDate: string;
};

export async function getOrSetUserIdCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("mc_uid")?.value;
  if (existing) return existing;
  
  const id = randomUUID();
  cookieStore.set("mc_uid", id, { 
    httpOnly: false, 
    sameSite: "lax", 
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  return id;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Initialize tables if they don't exist
export async function initializeTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        score BIGINT DEFAULT 0,
        clicks BIGINT DEFAULT 0,
        multiplier INTEGER DEFAULT 1,
        autoclick INTEGER DEFAULT 0,
        crit_chance DECIMAL(3,2) DEFAULT 0,
        nfts INTEGER DEFAULT 0,
        total_earned BIGINT DEFAULT 0,
        daily_mints INTEGER DEFAULT 0,
        last_mint_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard_current (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        score BIGINT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard_alltime (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        total_earned BIGINT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes if they don't exist
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_current_score ON leaderboard_current(score DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_alltime_total ON leaderboard_alltime(total_earned DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_last_mint ON users(last_mint_date);`;
    
  } catch (error) {
    console.error('Failed to initialize tables:', error);
  }
}

export async function getOrCreateUser(username?: string): Promise<UserRow> {
  const uid = await getOrSetUserIdCookie();
  
  try {
    // Initialize tables on first run
    await initializeTables();
    
    // Try to get existing user
    const result = await sql`SELECT * FROM users WHERE id = ${uid}`;
    
    if (result.rows.length === 0) {
      // Create new user
      const newUsername = username || `Player-${uid.slice(0, 6)}`;
      
      await sql`
        INSERT INTO users (id, username, score, clicks, multiplier, autoclick, crit_chance, nfts, total_earned, daily_mints, last_mint_date)
        VALUES (${uid}, ${newUsername}, 0, 0, 1, 0, 0, 0, 0, 0, ${getTodayString()})
      `;
      
      return {
        id: uid,
        username: newUsername,
        score: 0,
        clicks: 0,
        boosters: { multiplier: 1, autoclick: 0, critChance: 0 },
        nfts: 0,
        totalEarned: 0,
        dailyMints: 0,
        lastMintDate: getTodayString()
      };
    }
    
    const user = result.rows[0];
    
    // Update username if provided
    if (username && username !== user.username) {
      await sql`UPDATE users SET username = ${username} WHERE id = ${uid}`;
      user.username = username;
    }
    
    // Reset daily mints if new day
    const today = getTodayString();
    if (user.last_mint_date !== today) {
      await sql`UPDATE users SET daily_mints = 0, last_mint_date = ${today} WHERE id = ${uid}`;
      user.daily_mints = 0;
      user.last_mint_date = today;
    }
    
    return {
      id: user.id,
      username: user.username,
      score: parseInt(user.score),
      clicks: parseInt(user.clicks),
      boosters: {
        multiplier: user.multiplier,
        autoclick: user.autoclick,
        critChance: parseFloat(user.crit_chance)
      },
      nfts: user.nfts,
      totalEarned: parseInt(user.total_earned),
      dailyMints: user.daily_mints,
      lastMintDate: user.last_mint_date
    };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to get or create user');
  }
}

// Helper function to calculate progressive NFT pricing for boosters
export function calculateBoosterNFTCost(type: "multiplier" | "autoclick" | "crit", currentLevel: number): number {
  const baseCosts = {
    multiplier: 1,  // Base cost: 1 NFT for click multiplier
    autoclick: 1,   // Base cost: 1 NFT for auto-click
    crit: 2        // Base cost: 2 NFTs for critical hit (more valuable)
  };
  
  const baseCost = baseCosts[type];
  
  // Progressive NFT pricing: cost increases every few levels
  // Formula: baseCost + Math.floor(currentLevel / 2)
  return baseCost + Math.floor(currentLevel / 2);
}

export function getRemainingMints(user: UserRow): number {
  const today = getTodayString();
  if (user.lastMintDate !== today) {
    return 5; // New day, fresh mints
  }
  return Math.max(0, 5 - user.dailyMints);
}

// Legacy functions for compatibility (no longer used but kept to avoid breaking existing imports)
export async function readDB() {
  return { users: {}, leaderboard: [], alltimeLeaderboard: [] };
}

export async function writeDB() {
  // No-op for compatibility
}

export async function updateLeaderboard() {
  // This is now handled directly in the API routes
}