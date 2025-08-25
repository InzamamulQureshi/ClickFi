"use client";
import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
};

export default function ClickButton({ onClick }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xl shadow-lg hover:opacity-90 transition"
    >
      Click Me!
    </motion.button>
  );
}
