"use client";

import { useEffect, useState } from "react";
import ClickButton from "../components/ClickButton";
import ScoreBoard from "../components/ScoreBoard";
import Modal from "../components/Modal";

type User = {
  id: string;
  username: string;
  score: number;
  clicks: number;
  boosters: { multiplier: number; autoclick: number; critChance: number };
  nfts: number;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ username: string; score: number }[]>([]);
  const [gainFlash, setGainFlash] = useState<number | null>(null);

  // Load user
  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(d => setUser(d.user));
  }, []);

  // Click handler
  async function handleClick() {
    const res = await fetch("/api/click", { method: "POST" });
    const data = await res.json();
    setUser((prev) => prev ? { ...prev, score: data.score, clicks: data.clicks } : prev);
    setGainFlash(data.gain);
    setTimeout(() => setGainFlash(null), 800);
  }

  // Leaderboard
  async function openLeaderboard() {
    const r = await fetch("/api/leaderboard");
    const d = await r.json();
    setLeaderboard(d.leaderboard);
    setShowBoard(true);
  }

  // Shop actions
  async function buy(type: "multiplier" | "autoclick" | "crit", cost: number) {
    const r = await fetch("/api/booster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, cost }),
    });
    const d = await r.json();
    if (d.error) return alert(d.error);
    setUser(d.user);
  }

  async function mintNFT(cost = 1000) {
    const r = await fetch("/api/nft/mint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cost }),
    });
    const d = await r.json();
    if (d.error) return alert(d.error);
    setUser(d.user);
    alert(`Minted mock NFT #${d.tokenId}`);
  }

  return (
    <main className="min-h-screen px-4 py-10 flex flex-col items-center">
      <h1 className="text-5xl font-extrabold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Monad Clicker
      </h1>

      {user && (
        <div className="w-full max-w-xl space-y-6">
          <ScoreBoard
            score={user.score}
            clicks={user.clicks}
            boosters={user.boosters}
            nfts={user.nfts}
          />

          <div className="relative flex items-center justify-center py-8">
            <ClickButton onClick={handleClick} />
            {gainFlash !== null && (
              <div className="absolute -top-2 text-green-300 font-bold animate-float">
                +{gainFlash}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowShop(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700"
            >
              Shop
            </button>
            <button
              onClick={openLeaderboard}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Leaderboard
            </button>
            <button
              onClick={() => setShowAbout(true)}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              About
            </button>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showShop && user && (
        <Modal title="Shop" onClose={() => setShowShop(false)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-3">
              <div>
                <p className="font-semibold">Multiplier +1</p>
                <p className="text-sm text-gray-300">Increase click gains (current x{user.boosters.multiplier})</p>
              </div>
              <button
                onClick={() => buy("multiplier", 200)}
                className="px-3 py-2 rounded-md bg-purple-600 hover:bg-purple-700"
              >
                Buy (200)
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-3">
              <div>
                <p className="font-semibold">Auto +1</p>
                <p className="text-sm text-gray-300">Adds +1 per click call (current +{user.boosters.autoclick})</p>
              </div>
              <button
                onClick={() => buy("autoclick", 150)}
                className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700"
              >
                Buy (150)
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-3">
              <div>
                <p className="font-semibold">Crit +5%</p>
                <p className="text-sm text-gray-300">Chance for x5 gain (current {(user.boosters.critChance*100).toFixed(0)}%)</p>
              </div>
              <button
                onClick={() => buy("crit", 250)}
                className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700"
              >
                Buy (250)
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-3">
              <div>
                <p className="font-semibold">Mint Mock NFT</p>
                <p className="text-sm text-gray-300">Costs 1000 points. Increments your NFT count.</p>
              </div>
              <button
                onClick={() => mintNFT(1000)}
                className="px-3 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Mint (1000)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leaderboard Modal */}
      {showBoard && (
        <Modal title="Leaderboard (Top 100)" onClose={() => setShowBoard(false)}>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {leaderboard.length === 0 && (
              <p className="text-gray-300">No scores yet. Start clicking!</p>
            )}
            {leaderboard.map((r, i) => (
              <div
                key={`${r.username}-${i}`}
                className="flex items-center justify-between border-b border-gray-800 py-2"
              >
                <span className="text-sm text-gray-300">#{i + 1}</span>
                <span className="font-medium">{r.username}</span>
                <span className="text-yellow-300 font-bold">{r.score}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* About Modal */}
      {showAbout && (
        <Modal title="About Monad Clicker" onClose={() => setShowAbout(false)}>
          <p className="text-gray-200 leading-relaxed">
            A simple clicker with boosters and a mock NFT mint — built with Next.js & Tailwind.
            All data is stored locally on the server (file DB), no crypto required.
            You can later swap the mock NFT/boosters to on-chain and keep this UI.
          </p>
        </Modal>
      )}
    </main>
  );
}
