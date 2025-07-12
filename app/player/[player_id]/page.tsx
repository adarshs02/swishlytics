"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Table1 from '../../components/table1';

// --- TYPE DEFINITIONS ---
interface SeasonalStats {
  season: string;
  team: string;
  player_age: number;
  games_played: number;
  avg_minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  swish_score: number;
  usage_rate: number;
  field_goal_pct: number;
  free_throw_pct: number;
  three_point_pct: number;
  true_shooting_pct: number;
  three_pointers_made: number;
  three_point_attempts: number;
  field_goals_made: number;
  field_goal_attempts: number;
  free_throws_made: number;
  free_throw_attempts: number;
}

interface PlayerDetails {
  full_name: string;
  player_stats: SeasonalStats[];
}

interface GameLog {
  game_id: string; // For unique key prop
  player_id: string; // To satisfy Table1 constraint
  game_date: string;
  opponent: string;
  win_loss: string;
  minutes_played: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

// --- COMPONENT ---
const PlayerPage = () => {
  const params = useParams();
  const player_id = params.player_id as string;

  const [playerDetails, setPlayerDetails] = useState<PlayerDetails | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player_id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [detailsRes, gameLogsRes] = await Promise.all([
          fetch(`/api/player/${player_id}/details`),
          fetch(`/api/player/${player_id}/gamelogs`)
        ]);

        if (!detailsRes.ok || !gameLogsRes.ok) {
          throw new Error('Failed to fetch player data');
        }

        const detailsData = await detailsRes.json();
        const gameLogsData = await gameLogsRes.json();

        // Sort player stats by season chronologically
        if (detailsData && detailsData.player_stats) {
          detailsData.player_stats.sort((a: SeasonalStats, b: SeasonalStats) => {
            const seasonA = parseInt(a.season.split('-')[0]);
            const seasonB = parseInt(b.season.split('-')[0]);
            return seasonA - seasonB;
          });
        }

        // Add a unique key to each game log for React rendering
        const gameLogsWithKeys = gameLogsData.map((log: GameLog, index: number) => ({
            ...log,
            game_id: `${player_id}-${log.game_date}-${index}`,
            player_id: player_id // To satisfy Table1's generic constraint
        }));

        setPlayerDetails(detailsData);
        setGameLogs(gameLogsWithKeys);

      } catch (err) {
        setError('Could not load player data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [player_id]);

  if (isLoading) {
    return <div className="text-center p-10">Loading player data...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!playerDetails) {
    return <div className="text-center p-10">Player not found.</div>;
  }

  const getStatCellStyle = (player: SeasonalStats, statKey: keyof SeasonalStats | (string & {})): React.CSSProperties => {
    const maxAlpha = 0.6; // Max opacity for the background color

    // Special case for swish_score, which is a composite score
    if (statKey === 'swish_score') {
        const maxSwishScore = 15;
        const score = player.swish_score || 0;
        let color = '';
        if (score > 0) {
            const alpha = Math.min(score / maxSwishScore, 1) * maxAlpha;
            color = `rgba(0, 255, 0, ${alpha})`;
        } else {
            const alpha = Math.min(Math.abs(score) / maxSwishScore, 1) * maxAlpha;
            color = `rgba(255, 0, 0, ${alpha})`;
        }
        return { backgroundColor: color };
    }

    const zScoreKey = `${String(statKey)}_z_score`;
    const zScore = (player as any)[zScoreKey];

    if (typeof zScore !== 'number') {
      return {};
    }

    // Define a max z-score for scaling. Scores beyond this will have max color intensity.
    const maxZScore = 2.5;
    let color = '';

    // Invert colors for turnovers, where a high z-score is bad.
    const isNegativeStat = String(statKey) === 'turnovers';

    if ((zScore > 0 && !isNegativeStat) || (zScore < 0 && isNegativeStat)) {
      // Good stats are green
      const alpha = Math.min(Math.abs(zScore) / maxZScore, 1) * maxAlpha;
      color = `rgba(0, 255, 0, ${alpha})`;
    } else if ((zScore < 0 && !isNegativeStat) || (zScore > 0 && isNegativeStat)) {
      // Bad stats are red
      const alpha = Math.min(Math.abs(zScore) / maxZScore, 1) * maxAlpha;
      color = `rgba(255, 0, 0, ${alpha})`;
    }

    return { backgroundColor: color };
  };

  const seasonStatsColumns = [
    { key: 'season', label: 'Season' },
    { key: 'team', label: 'Team' },
    { key: 'player_age', label: 'Age' },
    { key: 'games_played', label: 'GP' },
    { key: 'avg_minutes', label: 'MIN' },
    { key: 'points', label: 'PTS' },
    { key: 'rebounds', label: 'REB' },
    { key: 'assists', label: 'AST' },
    { key: 'steals', label: 'STL' },
    { key: 'blocks', label: 'BLK' },
    { key: 'turnovers', label: 'TOV' },
    { key: 'field_goal_pct', label: 'FG%' },
    { key: 'free_throw_pct', label: 'FT%' },
    { key: 'three_pointers_made', label: '3PM' },
    { key: 'three_point_attempts', label: '3PA' },
    { key: 'three_point_pct', label: '3P%' },
    { key: 'field_goals_made', label: 'FGM' },
    { key: 'field_goal_attempts', label: 'FGA' },
    { key: 'free_throws_made', label: 'FTM' },
    { key: 'free_throw_attempts', label: 'FTA' },
    { key: 'true_shooting_pct', label: 'TS%' },
    { key: 'usage_rate', label: 'Usage' },
    { key: 'swish_score', label: 'Swish Score' },
  ];

  const gameLogColumns = [
    { key: 'game_date', label: 'Date' },
    { key: 'opponent', label: 'Opponent' },
    { key: 'win_loss', label: 'Result' },
    { key: 'minutes_played', label: 'MIN' },
    { key: 'points', label: 'PTS' },
    { key: 'rebounds', label: 'REB' },
    { key: 'assists', label: 'AST' },
    { key: 'steals', label: 'STL' },
    { key: 'blocks', label: 'BLK' },
    { key: 'turnovers', label: 'TOV' },
  ];

  const renderSeasonStatsCell = (stats: SeasonalStats, key: keyof SeasonalStats | (string & {})) => {
    const value = stats[key as keyof SeasonalStats];

    const formatValue = (val: any) => {
        if (typeof val === 'number') {
            const stringKey = String(key);
            if (stringKey.includes('_pct') || stringKey === 'usage_rate') {
                return `${(val * 100).toFixed(1)}%`;
            }
            if (stringKey === 'swish_score') {
                return val.toFixed(2);
            }
            if (stringKey === 'player_age' || stringKey === 'games_played') {
                return val.toFixed(0);
            }
            return val.toFixed(1);
        }
        return val;
    }

    if (String(key) === 'season' || String(key) === 'team') {
        return formatValue(value);
    }

    return <span className="font-bold">{formatValue(value)}</span>;
  };

  const renderGameLogCell = (log: GameLog, key: keyof GameLog | (string & {})) => {
    const value = log[key as keyof GameLog];
    if (key === 'game_date') {
      return new Date(value as string).toLocaleDateString();
    }
    if (key === 'win_loss') {
      return <span className={`font-bold ${value === 'W' ? 'text-green-400' : 'text-red-400'}`}>{value}</span>;
    }
    return value;
  };

  return (
    <>
      <header>
        <h1>Swishlytics</h1>
      </header>
      <main>
        <div className="mb-6">
          <Link href="/" className="text-blue-400 hover:text-blue-300">&larr; Back to Rankings</Link>
        </div>
        <h1 className="text-4xl font-bold mb-6 text-center">{playerDetails.full_name}</h1>

        <h2 className="text-2xl font-semibold mb-4">Per Game Season Stats</h2>
        <Table1
          columns={seasonStatsColumns}
          data={playerDetails.player_stats}
          renderCell={renderSeasonStatsCell}
          getCellStyle={getStatCellStyle}
        />

        <h2 className="text-2xl font-semibold mb-4 mt-8">Recent Game Logs</h2>
        <Table1<GameLog>
          columns={gameLogColumns}
          data={gameLogs}
          renderCell={renderGameLogCell}
        />
      </main>
      <footer>
        <p>&copy; 2025 Swishlytics</p>
      </footer>
    </>
  );
};

export default PlayerPage;
