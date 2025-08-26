"use client";

import { useEffect, useState } from "react";
import ClickButton from "../components/ClickButton";
import ScoreBoard from "../components/ScoreBoard";
import Modal from "../components/Modal";
import { Zap, Trophy, ShoppingBag, Info, Coins } from "lucide-react";

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
  const [isClicking, setIsClicking] = useState(false);

  // Load user
  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(d => setUser(d.user));
  }, []);

  // Click handler with enhanced effects
  async function handleClick() {
    setIsClicking(true);
    const res = await fetch("/api/click", { method: "POST" });
    const data = await res.json();
    setUser((prev) => prev ? { ...prev, score: data.score, clicks: data.clicks } : prev);
    setGainFlash(data.gain);
    setTimeout(() => {
      setGainFlash(null);
      setIsClicking(false);
    }, 800);
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
    alert(`Minted Monad NFT #${d.tokenId} 🎉`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <div className="relative z-10 px-4 py-8 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black mb-2 bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            MONAD
          </h1>
          <h2 className="text-3xl font-bold text-white/90 tracking-wide">CLICKER</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-3 rounded-full"></div>
        </div>

        {user && (
          <div className="w-full max-w-md space-y-6">
            <ScoreBoard
              score={user.score}
              clicks={user.clicks}
              boosters={user.boosters}
              nfts={user.nfts}
            />

            {/* Click Area */}
            <div className="relative flex items-center justify-center py-12">
              <ClickButton onClick={handleClick} isClicking={isClicking} />
              
              {/* Enhanced gain flash */}
              {gainFlash !== null && (
                <div className="absolute -top-4 text-yellow-300 font-black text-2xl animate-float pointer-events-none">
                  +{gainFlash}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowShop(true)}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 transition-all duration-300 shadow-lg text-white font-bold"
              >
                🛒 Shop
              </button>

              <button
                onClick={openLeaderboard}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg text-white font-bold"
              >
                🏆 Ranks
              </button>

              <button
                onClick={() => mintNFT(1000)}
                disabled={!user || user.score < 1000}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 shadow-lg text-black font-bold"
              >
                🪙 Mint NFT
              </button>

              <button
                onClick={() => setShowAbout(true)}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg text-white font-bold"
              >
                ℹ️ About
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!user && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70">Loading your Monad adventure...</p>
          </div>
        )}
      </div>

      {/* Shop Modal */}
      {showShop && user && (
        <Modal title="⚡ Power-Up Shop" onClose={() => setShowShop(false)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-purple-500/30 p-4 bg-purple-900/30">
              <div>
                <p className="font-bold text-purple-300">🔥 Click Multiplier +1</p>
                <p className="text-sm text-gray-300">Current: x{user.boosters.multiplier}</p>
              </div>
              <button
                onClick={() => buy("multiplier", 200)}
                disabled={user.score < 200}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-bold text-white"
              >
                200 🪙
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-blue-500/30 p-4 bg-blue-900/30">
              <div>
                <p className="font-bold text-blue-300">🤖 Auto-Boost +1</p>
                <p className="text-sm text-gray-300">Current: +{user.boosters.autoclick}</p>
              </div>
              <button
                onClick={() => buy("autoclick", 150)}
                disabled={user.score < 150}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-bold text-white"
              >
                150 🪙
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 p-4 bg-emerald-900/30">
              <div>
                <p className="font-bold text-emerald-300">💎 Critical Hit +5%</p>
                <p className="text-sm text-gray-300">Current: {(user.boosters.critChance*100).toFixed(0)}%</p>
              </div>
              <button
                onClick={() => buy("crit", 250)}
                disabled={user.score < 250}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-bold text-white"
              >
                250 🪙
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leaderboard Modal */}
      {showBoard && (
        <Modal title="🏆 Monad Champions" onClose={() => setShowBoard(false)}>
          <div className="space-y-3">
            {leaderboard.length === 0 && (
              <p className="text-gray-300 text-center py-8">No champions yet. Be the first!</p>
            )}
            {leaderboard.map((r, i) => (
              <div
                key={`${r.username}-${i}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-yellow-300">#{i + 1}</span>
                  <span className="font-medium text-white">{r.username}</span>
                </div>
                <span className="text-yellow-300 font-bold">{r.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* About Modal */}
      {showAbout && (
        <Modal title="🚀 About Monad Clicker" onClose={() => setShowAbout(false)}>
          <div className="text-gray-200 leading-relaxed">
            <p className="mb-4">
              <strong className="text-purple-300">Welcome to Monad Clicker!</strong> 🎮
            </p>
            <p className="mb-4">
              A next-gen Web3 clicker game built on the blazing-fast Monad blockchain. 
              Click to earn tokens, unlock powerful boosters, and climb the leaderboards!
            </p>
            <p className="text-sm text-gray-400">
              Built with Next.js, Tailwind CSS, and lots of ⚡
            </p>
          </div>
        </Modal>
      )}
    </main>
  );
}