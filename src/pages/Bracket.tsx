import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDarkMode } from '@/hooks/useDarkMode';
import { WalletDisplay } from '@/components/WalletDisplay';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNews } from '@/hooks/useNews';
import { proxyImage } from '@/lib/image-overrides';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { cn } from '@/lib/utils';

/* ── Types ── */
interface BracketTeam {
  seed: number;
  name: string;
  score?: number;
  logo?: string;
  isWinner?: boolean;
}

interface BracketMatchup {
  id: string;
  status: 'final' | 'live' | 'upcoming';
  team1: BracketTeam;
  team2: BracketTeam;
  marketId?: string;
}

interface BracketRound {
  label: string;
  matchups: BracketMatchup[];
}

interface BracketRegion {
  name: string;
  rounds: BracketRound[];
}

/* ── NCAA Bracket Data (2026 Tournament) ── */
const NCAA_REGIONS: BracketRegion[] = [
  {
    name: 'East',
    rounds: [
      {
        label: 'Primeira Rodada',
        matchups: [
          { id: 'e1', status: 'final', team1: { seed: 1, name: 'Duke', score: 71, isWinner: true }, team2: { seed: 16, name: 'Siena', score: 65 } },
          { id: 'e2', status: 'final', team1: { seed: 8, name: 'Ohio St.', score: 64 }, team2: { seed: 9, name: 'TCU', score: 66, isWinner: true } },
          { id: 'e3', status: 'final', team1: { seed: 5, name: "St. John's", score: 79, isWinner: true }, team2: { seed: 12, name: 'N. Iowa', score: 53 } },
          { id: 'e4', status: 'final', team1: { seed: 4, name: 'Kansas', score: 68, isWinner: true }, team2: { seed: 13, name: 'Cal Baptist', score: 60 } },
          { id: 'e5', status: 'final', team1: { seed: 6, name: 'Louisville', score: 83, isWinner: true }, team2: { seed: 11, name: 'S. Florida', score: 79 } },
          { id: 'e6', status: 'final', team1: { seed: 3, name: 'Michigan St.', score: 92, isWinner: true }, team2: { seed: 14, name: 'N. Dakota St.', score: 67 } },
          { id: 'e7', status: 'final', team1: { seed: 7, name: 'Clemson', score: 76, isWinner: true }, team2: { seed: 10, name: 'Drake', score: 68 } },
          { id: 'e8', status: 'final', team1: { seed: 2, name: 'UConn', score: 85, isWinner: true }, team2: { seed: 15, name: 'Norfolk St.', score: 60 } },
        ],
      },
      {
        label: 'Segunda Rodada',
        matchups: [
          { id: 'e9', status: 'final', team1: { seed: 1, name: 'Duke', score: 81, isWinner: true }, team2: { seed: 9, name: 'TCU', score: 58 } },
          { id: 'e10', status: 'final', team1: { seed: 5, name: "St. John's", score: 67, isWinner: true }, team2: { seed: 4, name: 'Kansas', score: 65 } },
          { id: 'e11', status: 'final', team1: { seed: 6, name: 'Louisville', score: 69 }, team2: { seed: 3, name: 'Michigan St.', score: 77, isWinner: true } },
          { id: 'e12', status: 'final', team1: { seed: 7, name: 'Clemson', score: 62 }, team2: { seed: 2, name: 'UConn', score: 73, isWinner: true } },
        ],
      },
      {
        label: 'Quartas',
        matchups: [
          { id: 'e13', status: 'final', team1: { seed: 1, name: 'Duke', score: 80, isWinner: true }, team2: { seed: 5, name: "St. John's", score: 75 } },
          { id: 'e14', status: 'final', team1: { seed: 3, name: 'Michigan St.', score: 65 }, team2: { seed: 2, name: 'UConn', score: 73, isWinner: true } },
        ],
      },
      {
        label: 'Semifinal',
        matchups: [
          { id: 'e15', status: 'final', team1: { seed: 1, name: 'Duke', score: 72 }, team2: { seed: 2, name: 'UConn', score: 73, isWinner: true } },
        ],
      },
    ],
  },
  {
    name: 'West',
    rounds: [
      {
        label: 'Primeira Rodada',
        matchups: [
          { id: 'w1', status: 'final', team1: { seed: 1, name: 'Arizona', score: 92, isWinner: true }, team2: { seed: 16, name: 'Long Island', score: 58 } },
          { id: 'w2', status: 'final', team1: { seed: 8, name: 'Villanova', score: 76 }, team2: { seed: 9, name: 'Utah St.', score: 86, isWinner: true } },
          { id: 'w3', status: 'final', team1: { seed: 5, name: 'Wisconsin', score: 82 }, team2: { seed: 12, name: 'High Point', score: 83, isWinner: true } },
          { id: 'w4', status: 'final', team1: { seed: 4, name: 'Arkansas', score: 97, isWinner: true }, team2: { seed: 13, name: 'Hawaii', score: 78 } },
          { id: 'w5', status: 'final', team1: { seed: 6, name: 'BYU', score: 71 }, team2: { seed: 11, name: 'Texas', score: 79, isWinner: true } },
          { id: 'w6', status: 'final', team1: { seed: 3, name: 'Gonzaga', score: 73, isWinner: true }, team2: { seed: 14, name: 'Kennesaw St.', score: 64 } },
          { id: 'w7', status: 'final', team1: { seed: 7, name: 'Marquette', score: 80, isWinner: true }, team2: { seed: 10, name: 'New Mexico', score: 72 } },
          { id: 'w8', status: 'final', team1: { seed: 2, name: 'Purdue', score: 78, isWinner: true }, team2: { seed: 15, name: 'FGCU', score: 55 } },
        ],
      },
      {
        label: 'Segunda Rodada',
        matchups: [
          { id: 'w9', status: 'final', team1: { seed: 1, name: 'Arizona', score: 78, isWinner: true }, team2: { seed: 9, name: 'Utah St.', score: 66 } },
          { id: 'w10', status: 'final', team1: { seed: 12, name: 'High Point', score: 88 }, team2: { seed: 4, name: 'Arkansas', score: 94, isWinner: true } },
          { id: 'w11', status: 'final', team1: { seed: 11, name: 'Texas', score: 74, isWinner: true }, team2: { seed: 3, name: 'Gonzaga', score: 68 } },
          { id: 'w12', status: 'final', team1: { seed: 7, name: 'Marquette', score: 65 }, team2: { seed: 2, name: 'Purdue', score: 70, isWinner: true } },
        ],
      },
      {
        label: 'Quartas',
        matchups: [
          { id: 'w13', status: 'final', team1: { seed: 1, name: 'Arizona', score: 109, isWinner: true }, team2: { seed: 4, name: 'Arkansas', score: 88 } },
          { id: 'w14', status: 'final', team1: { seed: 11, name: 'Texas', score: 74 }, team2: { seed: 2, name: 'Purdue', score: 64 } },
        ],
      },
      {
        label: 'Semifinal',
        matchups: [
          { id: 'w15', status: 'final', team1: { seed: 1, name: 'Arizona', score: 79, isWinner: true }, team2: { seed: 2, name: 'Purdue', score: 64 } },
        ],
      },
    ],
  },
  {
    name: 'South',
    rounds: [
      {
        label: 'Primeira Rodada',
        matchups: [
          { id: 's1', status: 'final', team1: { seed: 1, name: 'Auburn', score: 88, isWinner: true }, team2: { seed: 16, name: 'Alabama St.', score: 55 } },
          { id: 's2', status: 'final', team1: { seed: 8, name: 'Louisville', score: 72 }, team2: { seed: 9, name: 'Creighton', score: 78, isWinner: true } },
          { id: 's3', status: 'final', team1: { seed: 5, name: 'Michigan', score: 85, isWinner: true }, team2: { seed: 12, name: 'UC San Diego', score: 70 } },
          { id: 's4', status: 'final', team1: { seed: 4, name: 'Texas A&M', score: 76, isWinner: true }, team2: { seed: 13, name: 'Yale', score: 68 } },
          { id: 's5', status: 'final', team1: { seed: 6, name: 'Illinois', score: 90, isWinner: true }, team2: { seed: 11, name: 'Xavier', score: 75 } },
          { id: 's6', status: 'final', team1: { seed: 3, name: 'Iowa St.', score: 82, isWinner: true }, team2: { seed: 14, name: 'Lipscomb', score: 60 } },
          { id: 's7', status: 'final', team1: { seed: 7, name: 'UCLA', score: 74 }, team2: { seed: 10, name: 'VCU', score: 77, isWinner: true } },
          { id: 's8', status: 'final', team1: { seed: 2, name: 'Florida', score: 90, isWinner: true }, team2: { seed: 15, name: 'Norfolk St.', score: 58 } },
        ],
      },
      {
        label: 'Segunda Rodada',
        matchups: [
          { id: 's9', status: 'final', team1: { seed: 1, name: 'Auburn', score: 80, isWinner: true }, team2: { seed: 9, name: 'Creighton', score: 70 } },
          { id: 's10', status: 'final', team1: { seed: 5, name: 'Michigan', score: 88, isWinner: true }, team2: { seed: 4, name: 'Texas A&M', score: 82 } },
          { id: 's11', status: 'final', team1: { seed: 6, name: 'Illinois', score: 78 }, team2: { seed: 3, name: 'Iowa St.', score: 85, isWinner: true } },
          { id: 's12', status: 'final', team1: { seed: 10, name: 'VCU', score: 64 }, team2: { seed: 2, name: 'Florida', score: 80, isWinner: true } },
        ],
      },
      {
        label: 'Quartas',
        matchups: [
          { id: 's13', status: 'final', team1: { seed: 1, name: 'Auburn', score: 82, isWinner: true }, team2: { seed: 5, name: 'Michigan', score: 75 } },
          { id: 's14', status: 'final', team1: { seed: 3, name: 'Iowa St.', score: 70 }, team2: { seed: 2, name: 'Florida', score: 78, isWinner: true } },
        ],
      },
      {
        label: 'Semifinal',
        matchups: [
          { id: 's15', status: 'upcoming', team1: { seed: 1, name: 'Auburn' }, team2: { seed: 2, name: 'Florida' } },
        ],
      },
    ],
  },
  {
    name: 'Midwest',
    rounds: [
      {
        label: 'Primeira Rodada',
        matchups: [
          { id: 'm1', status: 'final', team1: { seed: 1, name: 'Houston', score: 82, isWinner: true }, team2: { seed: 16, name: 'SIU Edwardsville', score: 55 } },
          { id: 'm2', status: 'final', team1: { seed: 8, name: 'Gonzaga', score: 75 }, team2: { seed: 9, name: 'Georgia', score: 80, isWinner: true } },
          { id: 'm3', status: 'final', team1: { seed: 5, name: 'Clemson', score: 72, isWinner: true }, team2: { seed: 12, name: 'McNeese', score: 65 } },
          { id: 'm4', status: 'final', team1: { seed: 4, name: 'Purdue', score: 85, isWinner: true }, team2: { seed: 13, name: 'High Point', score: 68 } },
          { id: 'm5', status: 'final', team1: { seed: 6, name: 'Maryland', score: 78, isWinner: true }, team2: { seed: 11, name: 'Drake', score: 70 } },
          { id: 'm6', status: 'final', team1: { seed: 3, name: 'Tennessee', score: 88, isWinner: true }, team2: { seed: 14, name: 'Wofford', score: 60 } },
          { id: 'm7', status: 'final', team1: { seed: 7, name: 'Memphis', score: 80, isWinner: true }, team2: { seed: 10, name: 'Colorado St.', score: 72 } },
          { id: 'm8', status: 'final', team1: { seed: 2, name: 'Alabama', score: 90, isWinner: true }, team2: { seed: 15, name: 'Robert Morris', score: 55 } },
        ],
      },
      {
        label: 'Segunda Rodada',
        matchups: [
          { id: 'm9', status: 'final', team1: { seed: 1, name: 'Houston', score: 76, isWinner: true }, team2: { seed: 9, name: 'Georgia', score: 68 } },
          { id: 'm10', status: 'final', team1: { seed: 5, name: 'Clemson', score: 70 }, team2: { seed: 4, name: 'Purdue', score: 75, isWinner: true } },
          { id: 'm11', status: 'final', team1: { seed: 6, name: 'Maryland', score: 72 }, team2: { seed: 3, name: 'Tennessee', score: 80, isWinner: true } },
          { id: 'm12', status: 'final', team1: { seed: 7, name: 'Memphis', score: 65 }, team2: { seed: 2, name: 'Alabama', score: 78, isWinner: true } },
        ],
      },
      {
        label: 'Quartas',
        matchups: [
          { id: 'm13', status: 'final', team1: { seed: 1, name: 'Houston', score: 85, isWinner: true }, team2: { seed: 4, name: 'Purdue', score: 78 } },
          { id: 'm14', status: 'final', team1: { seed: 3, name: 'Tennessee', score: 72 }, team2: { seed: 2, name: 'Alabama', score: 80, isWinner: true } },
        ],
      },
      {
        label: 'Semifinal',
        matchups: [
          { id: 'm15', status: 'upcoming', team1: { seed: 1, name: 'Houston' }, team2: { seed: 2, name: 'Alabama' } },
        ],
      },
    ],
  },
];

const FINAL_FOUR: BracketRound = {
  label: 'Final Four',
  matchups: [
    { id: 'ff1', status: 'upcoming', team1: { seed: 2, name: 'UConn' }, team2: { seed: 1, name: 'Arizona' } },
    { id: 'ff2', status: 'upcoming', team1: { seed: 0, name: 'TBD' }, team2: { seed: 0, name: 'TBD' } },
  ],
};

const CHAMPIONSHIP: BracketRound = {
  label: 'Final',
  matchups: [
    { id: 'champ', status: 'upcoming', team1: { seed: 0, name: 'TBD' }, team2: { seed: 0, name: 'TBD' } },
  ],
};

/* ── Matchup card ── */
function MatchupCard({ matchup }: { matchup: BracketMatchup }) {
  const isFinal = matchup.status === 'final';
  const isLive = matchup.status === 'live';

  return (
    <div className={cn(
      'bracket-matchup',
      isLive && 'bracket-matchup-live',
    )}>
      {matchup.status !== 'upcoming' && (
        <span className={cn('bracket-status', isLive && 'text-red')}>
          {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red mr-1 animate-pulse" />}
          {isFinal ? 'Final' : isLive ? 'AO VIVO' : ''}
        </span>
      )}
      <TeamRow team={matchup.team1} isFinal={isFinal} />
      <TeamRow team={matchup.team2} isFinal={isFinal} />
    </div>
  );
}

function TeamRow({ team, isFinal }: { team: BracketTeam; isFinal: boolean }) {
  return (
    <div className={cn('bracket-team', team.isWinner && 'bracket-team-winner')}>
      <div className="bracket-team-info">
        {team.logo ? (
          <img src={proxyImage(team.logo)} alt={team.name} className="w-5 h-5 rounded-sm object-contain" />
        ) : (
          <span className="bracket-seed">{team.seed || '?'}</span>
        )}
        <span className={cn('bracket-team-name', team.isWinner && 'font-bold')}>{team.name}</span>
      </div>
      {isFinal && team.score != null && (
        <span className={cn('bracket-score', team.isWinner && 'font-bold text-foreground')}>{team.score}</span>
      )}
    </div>
  );
}

/* ── Bracket Column (a single round) ── */
function BracketColumn({ round, roundIndex, totalRounds }: { round: BracketRound; roundIndex: number; totalRounds: number }) {
  const gap = Math.pow(2, roundIndex) * 8;

  return (
    <div className="bracket-column" style={{ gap: `${gap}px` }}>
      {round.matchups.map((matchup) => (
        <div key={matchup.id} className="bracket-matchup-wrapper">
          <MatchupCard matchup={matchup} />
        </div>
      ))}
    </div>
  );
}

/* ── Region bracket ── */
function RegionBracket({ region }: { region: BracketRegion }) {
  return (
    <div className="bracket-region">
      <div className="bracket-rounds">
        {region.rounds.map((round, i) => (
          <BracketColumn key={round.label} round={round} roundIndex={i} totalRounds={region.rounds.length} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Bracket() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const { isAuthenticated } = useAuthContext();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const regions = selectedRegion === 'all' ? NCAA_REGIONS : NCAA_REGIONS.filter(r => r.name === selectedRegion);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
              <Link to="/"><img src={isDark ? logoDark : logoLight} alt="OnChoice" className="h-7 md:h-8" /></Link>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? <WalletDisplay /> : (
                <><Button variant="outline" size="sm" asChild><Link to="/login">Entrar</Link></Button><Button size="sm" asChild><Link to="/signup">Cadastrar</Link></Button></>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="bracket-hero">
        <div className="container relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white">Chave do Torneio NCAA</h1>
              <p className="text-sm md:text-base text-white/70">Previsões e odds ao vivo de basquete universitário</p>
            </div>
          </div>
        </div>
        {/* Decorative bracket lines */}
        <div className="bracket-hero-decoration" />
      </div>

      {/* Tabs */}
      <div className="container py-4">
        <Tabs value={selectedRegion} onValueChange={setSelectedRegion}>
          <TabsList className="bg-secondary/60">
            <TabsTrigger value="all">Todas Regiões</TabsTrigger>
            {NCAA_REGIONS.map(r => (
              <TabsTrigger key={r.name} value={r.name}>{r.name}</TabsTrigger>
            ))}
            <TabsTrigger value="final4">Final Four</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bracket content */}
      <div className="container pb-16 overflow-x-auto" ref={scrollRef}>
        {selectedRegion === 'final4' ? (
          <div className="bracket-final-four">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Final Four</h2>
              <p className="text-sm text-muted-foreground">Semifinais & Final</p>
            </div>
            <div className="bracket-rounds justify-center">
              <BracketColumn round={FINAL_FOUR} roundIndex={0} totalRounds={3} />
              <BracketColumn round={CHAMPIONSHIP} roundIndex={1} totalRounds={3} />
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {regions.map(region => (
              <div key={region.name}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{region.name}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <RegionBracket region={region} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
