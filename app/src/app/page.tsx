import Link from 'next/link';

const GAMES = [
  {
    id: '0022401102',
    away: { abbrev: 'MIN', name: 'Timberwolves', score: 140, color: '#236192' },
    home: { abbrev: 'DEN', name: 'Nuggets', score: 139, color: '#FEC524' },
    label: 'Jokic 61-PT Triple-Double — 2OT Thriller',
    date: 'April 1, 2025',
  },
  {
    id: '0042300237',
    away: { abbrev: 'MIN', name: 'Timberwolves', score: 98, color: '#236192' },
    home: { abbrev: 'DEN', name: 'Nuggets', score: 90, color: '#FEC524' },
    label: 'Western Conf Semis Game 7',
    date: 'May 19, 2024',
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">NBA Match Dashboard</h1>
      <p className="text-white/50 mb-8">
        Interactive game visualizations — shot charts, assist networks, score
        timelines
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((game) => (
          <Link
            key={game.id}
            href={`/game/${game.id}`}
            className="block bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors"
          >
            <div className="text-xs text-white/40 mb-3">{game.label}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="text-lg font-bold"
                  style={{ color: game.away.color }}
                >
                  {game.away.abbrev}
                </span>
                <span className="text-2xl font-black tabular-nums text-white">
                  {game.away.score}
                </span>
              </div>
              <span className="text-white/20 text-sm">vs</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tabular-nums text-white">
                  {game.home.score}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: game.home.color }}
                >
                  {game.home.abbrev}
                </span>
              </div>
            </div>
            <div className="text-xs text-white/30 mt-2">{game.date}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
