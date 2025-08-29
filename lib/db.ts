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
};

type DB = {
  users: Record<string, UserRow>;
  leaderboard: { id: string; username: string; score: number }[];
};

// In-memory database (will reset on server restart, but no file corruption issues)
let memoryDB: DB = {
  users: {},
  leaderboard: []
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
    };
    db.users[uid] = user;
    await writeDB(db);
  } else if (username && username !== user.username) {
    user.username = username;
    db.users[uid] = user;
    await writeDB(db);
  }
  
  // Ensure boosters exist
  if (!user.boosters) {
    user.boosters = { multiplier: 1, autoclick: 0, critChance: 0 };
    db.users[uid] = user;
    await writeDB(db);
  }
  
  return user;
}

export async function updateLeaderboard(user: UserRow): Promise<void> {
  const db = await readDB();
  const idx = db.leaderboard.findIndex((r) => r.id === user.id);
  
  if (idx >= 0) {
    db.leaderboard[idx].score = user.score;
    db.leaderboard[idx].username = user.username;
  } else {
    db.leaderboard.push({ id: user.id, username: user.username, score: user.score });
  }
  
  db.leaderboard.sort((a, b) => b.score - a.score);
  db.leaderboard = db.leaderboard.slice(0, 100);
  await writeDB(db);
}