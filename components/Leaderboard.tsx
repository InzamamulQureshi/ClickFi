export default function Leaderboard({ data }: { data: { user: string; score: number }[] }) {
  return (
    <table className="table-auto w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-700">
          <th className="p-2">User</th>
          <th className="p-2">Score</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b border-gray-600">
            <td className="p-2">{row.user}</td>
            <td className="p-2">{row.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

