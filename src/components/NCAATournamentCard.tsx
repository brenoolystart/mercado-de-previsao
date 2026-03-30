import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';

const MINI_TEAMS = [
  ['Duke', 'UConn'],
  ['Arizona', 'Purdue'],
  ['Auburn', 'Florida'],
  ['Houston', 'Alabama'],
];

export function NCAATournamentCard() {
  const navigate = useNavigate();

  return (
    <div className="ncaa-bracket-card" onClick={() => navigate('/bracket')}>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <div>
            <h3 className="text-base md:text-lg font-extrabold text-white leading-tight">NCAA Tournament</h3>
            <p className="text-[11px] md:text-xs text-white/60">March Madness 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-white/70 hover:text-white transition-colors">
            <span className="text-xs font-medium hidden md:inline">Ver Bracket</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        {/* Mini animated bracket preview */}
        <div className="space-y-2">
          {MINI_TEAMS.slice(0, 2).map((pair, i) => (
            <div key={i} className="ncaa-mini-bracket">
              <div className="ncaa-mini-matchup" style={{ animationDelay: `${i * 0.15}s` }}>
                {pair[0]}
              </div>
              <div className="ncaa-mini-connector" />
              <div className="ncaa-mini-matchup" style={{ animationDelay: `${i * 0.15 + 0.1}s` }}>
                vs
              </div>
              <div className="ncaa-mini-connector" />
              <div className="ncaa-mini-matchup" style={{ animationDelay: `${i * 0.15 + 0.2}s` }}>
                {pair[1]}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div className="flex items-center gap-4 mt-3 text-[10px] md:text-xs text-white/50">
          <span>🏀 64 times</span>
          <span>📊 $23M Vol.</span>
          <span className="ml-auto text-white/70 font-semibold">Final Four →</span>
        </div>
      </div>
    </div>
  );
}
