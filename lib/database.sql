// 1. First, install the PostgreSQL client
// Run: npm install pg @types/pg

// 2. Create a new file: lib/database.sql
// Copy this SQL to set up your tables:

CREATE TABLE users (
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

CREATE TABLE leaderboard_current (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  score BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leaderboard_alltime (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  total_earned BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_leaderboard_current_score ON leaderboard_current(score DESC);
CREATE INDEX idx_leaderboard_alltime_total ON leaderboard_alltime(total_earned DESC);
CREATE INDEX idx_users_last_mint ON users(last_mint_date);

// 3. Update your .env.local file:
DATABASE_URL="postgresql://username:password@host:5432/database_name"

// 4. Replace lib/db.ts with this PostgreSQL version:

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { Pool } from "pg";

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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
  return new Date().toISOString().split('T')[0];
}

export async function getOrCreateUser(username?: string): Promise<UserRow> {
  const uid = await getOrSetUserIdCookie();
  
  try {
    // Try to get existing user
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [uid]
    );
    
    if (result.rows.length === 0) {
      // Create new user
      const newUser = {
        id: uid,
        username: username || `Player-${uid.slice(0, 6)}`,
        score: 0,
        clicks: 0,
        multiplier: 1,
        autoclick: 0,
        crit_chance: 0,
        nfts: 0,
        total_earned: 0,
        daily_mints: 0,
        last_mint_date: getTodayString(),
      };
      
      await pool.query(`
        INSERT INTO users (id, username, score, clicks, multiplier, autoclick, crit_chance, nfts, total_earned, daily_mints, last_mint_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        newUser.id, newUser.username, newUser.score, newUser.clicks,
        newUser.multiplier, newUser.autoclick, newUser.crit_chance,
        newUser.nfts, newUser.total_earned, newUser.daily_mints, newUser.last_mint_date
      ]);
      
      return {
        ...newUser,
        boosters: {
          multiplier: newUser.multiplier,
          autoclick: newUser.autoclick,
          critChance: newUser.crit_chance
        },
        lastMintDate: newUser.last_mint_date
      };
    }
    
    const user = result.rows[0];
    
    // Update username if provided
    if (username && username !== user.username) {
      await pool.query(
        'UPDATE users SET username = $1 WHERE id = $2',
        [username, uid]
      );
      user.username = username;
    }
    
    // Reset daily mints if new day
    const today = getTodayString();
    if (user.last_mint_date !== today) {
      await pool.query(
        'UPDATE users SET daily_mints = 0, last_mint_date = $1 WHERE id = $2',
        [today, uid]
      );
      user.daily_mints = 0;
      user.last_mint_date = today;
    }
    
    return {
      id: user.id,
      username: user.username,
      score: user.score,
      clicks: user.clicks,
      boosters: {
        multiplier: user.multiplier,
        autoclick: user.autoclick,
        critChance: user.crit_chance
      },
      nfts: user.nfts,
      totalEarned: user.total_earned,
      dailyMints: user.daily_mints,
      lastMintDate: user.last_mint_date
    };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to get or create user');
  }
}

export async function updateUser(user: UserRow): Promise<void> {
  try {
    await pool.query(`
      UPDATE users 
      SET score = $2, clicks = $3, multiplier = $4, autoclick = $5, 
          crit_chance = $6, nfts = $7, total_earned = $8, daily_mints = $9, 
          last_mint_date = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [
      user.id, user.score, user.clicks, user.boosters.multiplier,
      user.boosters.autoclick, user.boosters.critChance, user.nfts,
      user.totalEarned, user.dailyMints, user.lastMintDate
    ]);
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

export async function updateLeaderboard(user: UserRow): Promise<void> {
  try {
    // Update current balance leaderboard
    await pool.query(`
      INSERT INTO leaderboard_current (id, username, score)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      score = EXCLUDED.score,
      updated_at = CURRENT_TIMESTAMP
    `, [user.id, user.username, user.score]);
    
    // Update all-time earnings leaderboard
    await pool.query(`
      INSERT INTO leaderboard_alltime (id, username, total_earned)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      total_earned = EXCLUDED.total_earned,
      updated_at = CURRENT_TIMESTAMP
    `, [user.id, user.username, user.totalEarned]);
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
    throw error;
  }
}

export async function getLeaderboard(type: 'current' | 'alltime' = 'current') {
  try {
    const table = type === 'current' ? 'leaderboard_current' : 'leaderboard_alltime';
    const scoreColumn = type === 'current' ? 'score' : 'total_earned';
    
    const result = await pool.query(`
      SELECT username, ${scoreColumn} as score
      FROM ${table}
      ORDER BY ${scoreColumn} DESC
      LIMIT 100
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return [];
  }
}

export function calculateBoosterNFTCost(type: "multiplier" | "autoclick" | "crit", currentLevel: number): number {
  const baseCosts = {
    multiplier: 1,
    autoclick: 1,
    crit: 2
  };
  
  const baseCost = baseCosts[type];
  return baseCost + Math.floor(currentLevel / 2);
}

export function getRemainingMints(user: UserRow): number {
  const today = getTodayString();
  if (user.lastMintDate !== today) {
    return 5;
  }
  return Math.max(0, 5 - user.dailyMints);
}

// Clean shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});