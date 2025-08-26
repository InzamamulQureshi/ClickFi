"use client";
import { motion } from "framer-motion";
import { TrendingUp, Zap, Target, Coins } from "lucide-react";

export default function ScoreBoard({
  score,
  clicks,
  boosters,
  nfts
}: {
  score: number;
  clicks: number;
  boosters: { multiplier: number; autoclick: number; critChance: number };
  nfts: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 shadow-2xl border border-white/20"
    >
      {/* Main Score Display */}
      <div className="text-center mb-6">
        <motion.div
          key={score}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">
            Your Balance
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <Coins className="w-8 h-8 text-yellow-400" />
            <p className="text-5xl font-black text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text">
              {score.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-white/50 mt-1">{clicks.toLocaleString()} total transactions</p>
        </motion.div>
      </div>

      {/* Boosters Display */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wide mb-4 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Active Powers
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Multiplier Booster */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="font-semibold text-purple-300 text-sm">Click Multiplier</p>
                <p className="text-xs text-white/60">Boost per click</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-200">×{boosters.multiplier}</div>
              <div className="w-8 h-1 bg-purple-500/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((boosters.multiplier / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Auto-Click Booster */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="font-semibold text-blue-300 text-sm">Auto Boost</p>
                <p className="text-xs text-white/60">Extra per click</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-200">+{boosters.autoclick}</div>
              <div className="w-8 h-1 bg-blue-500/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((boosters.autoclick / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Critical Hit Booster */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-400/30"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="font-semibold text-emerald-300 text-sm">Critical Hit</p>
                <p className="text-xs text-white/60">5× chance</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-200">{(boosters.critChance * 100).toFixed(0)}%</div>
              <div className="w-8 h-1 bg-emerald-500/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((boosters.critChance / 0.5) * 100, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* NFT Collection Display */}
        {nfts > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🖼️</div>
                <div>
                  <p className="font-semibold text-yellow-300 text-sm">NFT Collection</p>
                  <p className="text-xs text-white/60">Monad exclusive tokens</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-yellow-200">{nfts}</div>
                <div className="text-xs text-yellow-300/70">owned</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}