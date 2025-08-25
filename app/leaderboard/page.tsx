"use client";

import { useEffect, useState } from "react";
import Leaderboard from "../../components/Leaderboard";

export default function LeaderboardPage() {
  const [data, setData] = useState<{ user: string; score: number }[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  return (
    <div className="p-6">
      <Leaderboard data={data} />
    </div>
  );
}

