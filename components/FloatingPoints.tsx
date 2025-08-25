"use client";

import { motion } from "framer-motion";

export default function FloatingPoints({
  x,
  y,
  value,
}: {
  x: number;
  y: number;
  value: number;
}) {
  return (
    <motion.div
      className="absolute text-yellow-400 font-bold"
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 1 }}
      style={{ left: x, top: y }}
    >
      +{value}
    </motion.div>
  );
}
