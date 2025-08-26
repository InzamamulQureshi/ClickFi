"use client";
import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
  isClicking?: boolean;
};

export default function ClickButton({ onClick, isClicking = false }: Props) {
  return (
    <div className="relative">
      {/* Main button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-2xl border-4 border-white/20 text-white font-bold text-xl"
      >
        ⚡ CLICK ⚡
      </motion.button>
    </div>
  );
}