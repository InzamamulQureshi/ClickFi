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
    <div className="w-full max-w-xl rounded-2xl bg-white/10 backdrop-blur p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Score</h2>
          <p className="text-4xl font-extrabold text-yellow-300">{score}</p>
          <p className="text-sm text-gray-300 mt-1">{clicks} total clicks</p>
        </div>
        <div className="text-sm text-gray-200 space-y-1">
          <p>Multiplier: x{boosters.multiplier}</p>
          <p>Auto: +{boosters.autoclick}/click</p>
          <p>Crit: {(boosters.critChance * 100).toFixed(0)}%</p>
          <p>NFTs: {nfts}</p>
        </div>
      </div>
    </div>
  );
}
