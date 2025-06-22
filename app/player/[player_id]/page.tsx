"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  player_stats: {
    [key: string]: any; // Allow for dynamic z-score keys
    season: string;
    team: string;
    games_played: number;
    avg_minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    player_age: number;
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
    usage_rate: number;
    swish_score: number;
  }[];
}

interface GameLog {
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
        // Fetch both details and game logs in parallel
        const [detailsRes, gameLogsRes] = await Promise.all([
          fetch(`/api/player/${player_id}/details`),
          fetch(`/api/player/${player_id}/gamelogs`)
        ]);

        if (!detailsRes.ok || !gameLogsRes.ok) {
          throw new Error('Failed to fetch player data');
        }

        const detailsData = await detailsRes.json();
        const gameLogsData = await gameLogsRes.json();

        setPlayerDetails(detailsData);
        setGameLogs(gameLogsData);

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

  // Function to determine cell style based on z-score
  const getStatCellStyle = (stats: any, statKey: string): React.CSSProperties => {
    let zScore;
    if (statKey === 'swish_score') {
      zScore = stats.swish_score;
    } else {
      const zScoreKey = `${statKey}_z_score`;
      zScore = stats[zScoreKey];
    }

    if (typeof zScore !== 'number') {
      return {}; // No style if z-score is not available
    }

    // Turnovers are bad, so we invert the color scale
    const isBadStat = statKey === 'turnovers';
    const effectiveZ = isBadStat ? -zScore : zScore;

    // Shift the z-score range to make green more exclusive
    // An average score (z-score=0) will now be orange-yellow
    const clampedZ = Math.max(-2, Math.min(4, effectiveZ));

    // Normalize the new clamped z-score to a [0, 1] range
    const normalizedZ = (clampedZ + 2) / 6;

    // Interpolate the hue value from red (0) to green (120)
    const hue = normalizedZ * 120;

    // Adjust lightness based on z-score
    let lightness = 80 - Math.abs(zScore) * 7;

    // Clamp lightness to prevent it from becoming too dark or too light
    lightness = Math.max(50, Math.min(90, lightness));

    return {
      backgroundColor: `hsl(${hue}, 90%, ${lightness}%)`,
      color: 'black',
      fontWeight: 'bold',
    };

  };

  return (
    <main className="container mx-auto p-4 md:p-8 bg-gray-900 text-white min-h-screen">
      <div className="mb-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300">&larr; Back to Rankings</Link>
      </div>
      <h1 className="text-4xl font-bold mb-6 text-center">{playerDetails.full_name}</h1>

      {/* Historical Season Stats */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Per Game Season Stats</h2>
        <div className="overflow-x-auto">
          <table className="player-page-table">
            <thead>
              <tr>
                <th>Season</th>
                <th>Team</th>
                <th>Age</th>
                <th>GP</th>
                <th>MIN</th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
                <th>STL</th>
                <th>BLK</th>
                <th>TOV</th>
                <th>FG%</th>
                <th>FGM</th>
                <th>FGA</th>
                <th>FT%</th>
                <th>FTM</th>
                <th>FTA</th>
                <th>3P%</th>
                <th>3PM</th>
                <th>3PA</th>
                <th>TS%</th>
                <th>Usage</th>
                <th>Swish Score</th>
              </tr>
            </thead>
            <tbody>
              {playerDetails.player_stats.map((stats, index) => (
                <tr key={index}>
                  <td className="font-medium">{stats.season}</td>
                  <td>{stats.team}</td>
                  <td>{stats.player_age}</td>
                  <td>{stats.games_played}</td>
                  <td>{stats.avg_minutes.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'points')}>{stats.points.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'rebounds')}>{stats.rebounds.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'assists')}>{stats.assists.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'steals')}>{stats.steals.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'blocks')}>{stats.blocks.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'turnovers')}>{stats.turnovers.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'field_goal_pct')}>{((stats.field_goal_pct || 0) * 100).toFixed(1)}%</td>
                  <td>{stats.field_goals_made.toFixed(1)}</td>
                  <td>{stats.field_goal_attempts.toFixed(1)}</td>
                  <td style={getStatCellStyle(stats, 'free_throw_pct')}>{((stats.free_throw_pct || 0) * 100).toFixed(1)}%</td>
                  <td>{stats.free_throws_made.toFixed(1)}</td>
                  <td>{stats.free_throw_attempts.toFixed(1)}</td>
                  <td>{(stats.three_point_pct * 100).toFixed(1)}%</td>
                  <td style={getStatCellStyle(stats, 'three_pointers_made')}>{stats.three_pointers_made.toFixed(1)}</td>
                  <td>{stats.three_point_attempts.toFixed(1)}</td>
                  <td>{(stats.true_shooting_pct * 100).toFixed(1)}%</td>
                  <td>{(stats.usage_rate * 100).toFixed(1)}%</td>
                  <td className="font-bold" style={getStatCellStyle(stats, 'swish_score')}>{stats.swish_score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Game Logs */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Recent Game Logs</h2>
        <div className="overflow-x-auto">
          <table className="player-page-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Result</th>
                <th>MIN</th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
                <th>STL</th>
                <th>BLK</th>
                <th>TOV</th>
              </tr>
            </thead>
            <tbody>
              {gameLogs.map((log, index) => (
                <tr key={index}>
                  <td>{new Date(log.game_date).toLocaleDateString()}</td>
                  <td>{log.opponent}</td>
                  <td className={`font-bold ${log.win_loss === 'W' ? 'text-green-400' : 'text-red-400'}`}>{log.win_loss}</td>
                  <td>{log.minutes_played}</td>
                  <td>{log.points}</td>
                  <td>{log.rebounds}</td>
                  <td>{log.assists}</td>
                  <td>{log.steals}</td>
                  <td>{log.blocks}</td>
                  <td>{log.turnovers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default PlayerPage;
