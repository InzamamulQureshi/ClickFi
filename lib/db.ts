import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

type BoosterState = {
  multiplier: number;   // e.g. 1, 2, 3
  autoclick: number;    // clicks per POST (we add on each click call)
  critChance: number;   // 0..1
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

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function ensureDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    const empty: DB = { users: {}, leaderboard: [] };
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(empty, null, 2), "utf-8");
  }
}

export async function readDB(): Promise<DB> {
  await ensureDB();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

export async function writeDB(db: DB) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export async function getOrSetUserIdCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("mc_uid")?.value;
  if (existing) return existing;
  const id = randomUUID();
  cookieStore.set("mc_uid", id, { httpOnly: false, sameSite: "lax", path: "/" });
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
    await writeDB(db);
  }
  return user;
}

export async function updateLeaderboard(user: UserRow) {
  const db = await readDB();
  const idx = db.leaderboard.findIndex((r) => r.id === user.id);
  if (idx >= 0) db.leaderboard[idx].score = user.score;
  else db.leaderboard.push({ id: user.id, username: user.username, score: user.score });
  db.leaderboard.sort((a, b) => b.score - a.score);
  db.leaderboard = db.leaderboard.slice(0, 100);
  await writeDB(db);
}