import { cookies } from "next/headers";
import { randomUUID } from "crypto";

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
  dailyMints: number; // Track daily mints
  lastMintDate: string; // Track last mint date (YYYY-MM-DD format)
};

type DB = {
  users: Record<string, UserRow>;
  leaderboard: { id: string; username: string; score: number }[];
  alltimeLeaderboard: { id: string; username: string; totalEarned: number }[];
};

// In-memory database (will reset on server restart, but no file corruption issues)
let memoryDB: DB = {
  users: {},
  leaderboard: [],
  alltimeLeaderboard: []
};

export async function readDB(): Promise<DB> {
  return memoryDB;
}

export async function writeDB(db: DB): Promise<void> {
  memoryDB = { ...db };
}

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

export async function getOrCreateUser(username?: string): Promise<UserRow> {
  const uid = await getOrSetUserIdCookie();
  const db = await readDB();
  
  let user = db.users[uid];
  if (!user) {
    user = {
      id: uid,
      username: username || `Player-${uid.slice(0, 6)}`,
      score: 0,
      clicks: 0,
      boosters: { multiplier: 1, autoclick: 0, critChance: 0 },
      nfts: 0,
      totalEarned: 0,
      dailyMints: 0,
      lastMintDate: getTodayString(),
    };
    db.users[uid] = user;
    await writeDB(db);
  } else if (username && username !== user.username) {
    user.username = username;
    db.users[uid] = user;
    await writeDB(db);
  }
  
  // Ensure all fields exist (for migration of existing users)
  if (!user.boosters) {
    user.boosters = { multiplier: 1, autoclick: 0, critChance: 0 };
  }
  if (typeof user.totalEarned !== 'number') {
    user.totalEarned = user.score;
  }
  if (typeof user.dailyMints !== 'number') {
    user.dailyMints = 0;
  }
  if (!user.lastMintDate) {
    user.lastMintDate = getTodayString();
  }
  
  // Reset daily mints if it's a new day
  const today = getTodayString();
  if (user.lastMintDate !== today) {
    user.dailyMints = 0;
    user.lastMintDate = today;
  }
  
  db.users[uid] = user;
  await writeDB(db);
  
  return user;
}

export async function updateLeaderboard(user: UserRow): Promise<void> {
  const db = await readDB();
  
  // Update current balance leaderboard
  const currentIdx = db.leaderboard.findIndex((r) => r.id === user.id);
  if (currentIdx >= 0) {
    db.leaderboard[currentIdx].score = user.score;
    db.leaderboard[currentIdx].username = user.username;
  } else {
    db.leaderboard.push({ id: user.id, username: user.username, score: user.score });
  }
  db.leaderboard.sort((a, b) => b.score - a.score);
  db.leaderboard = db.leaderboard.slice(0, 100);

  // Update all-time earnings leaderboard
  const alltimeIdx = db.alltimeLeaderboard.findIndex((r) => r.id === user.id);
  if (alltimeIdx >= 0) {
    db.alltimeLeaderboard[alltimeIdx].totalEarned = user.totalEarned;
    db.alltimeLeaderboard[alltimeIdx].username = user.username;
  } else {
    db.alltimeLeaderboard.push({ id: user.id, username: user.username, totalEarned: user.totalEarned });
  }
  db.alltimeLeaderboard.sort((a, b) => b.totalEarned - a.totalEarned);
  db.alltimeLeaderboard = db.alltimeLeaderboard.slice(0, 100);

  await writeDB(db);
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