import type { MockLeaderboardBoard } from "@/modules/leaderboard/mock-leaderboard-data";

export function MockLeaderboardTable({ board }: { board: MockLeaderboardBoard }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1 border-b pb-4">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {board.title}
        </p>
        <h2 className="font-display text-2xl tracking-tight md:text-3xl">
          {board.subtitle}
        </h2>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="border">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-3 font-medium sm:px-4">SN</th>
                <th className="px-3 py-3 font-medium sm:px-4">Access code</th>
                <th className="px-3 py-3 font-medium sm:px-4">Marks</th>
              </tr>
            </thead>
            <tbody>
              {board.entries.map((entry) => (
                <tr
                  key={`${board.id}-${entry.sn}`}
                  className="border-b last:border-0"
                >
                  <td className="px-3 py-3 tabular-nums text-muted-foreground sm:px-4">
                    {entry.sn}
                  </td>
                  <td className="px-3 py-3 font-mono tracking-wide sm:px-4">
                    {entry.maskedCode}
                  </td>
                  <td className="px-3 py-3 font-medium tabular-nums sm:px-4">
                    {entry.marks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
