"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// --- TYPE DEFINITIONS ---
interface SeasonalStats {
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
  swish_score: number;
}

interface PlayerDetails {
  full_name: string;
  player_stats_by_season: SeasonalStats[];
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

  return (
    <main className="container mx-auto p-4 md:p-8 bg-gray-900 text-white min-h-screen">
      <div className="mb-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300">&larr; Back to Rankings</Link>
      </div>
      <h1 className="text-4xl font-bold mb-6 text-center">{playerDetails.full_name}</h1>

      {/* Historical Season Stats */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Historical Season Stats</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3">Season</th>
                <th className="p-3">Team</th>
                <th className="p-3">GP</th>
                <th className="p-3">MIN</th>
                <th className="p-3">PTS</th>
                <th className="p-3">REB</th>
                <th className="p-3">AST</th>
                <th className="p-3">STL</th>
                <th className="p-3">BLK</th>
                <th className="p-3">TOV</th>
                <th className="p-3">Swish Score</th>
              </tr>
            </thead>
            <tbody>
              {playerDetails.player_stats_by_season.map((stats, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-3 font-medium">{stats.season}</td>
                  <td className="p-3">{stats.team}</td>
                  <td className="p-3">{stats.games_played}</td>
                  <td className="p-3">{stats.avg_minutes.toFixed(1)}</td>
                  <td className="p-3">{stats.points.toFixed(1)}</td>
                  <td className="p-3">{stats.rebounds.toFixed(1)}</td>
                  <td className="p-3">{stats.assists.toFixed(1)}</td>
                  <td className="p-3">{stats.steals.toFixed(1)}</td>
                  <td className="p-3">{stats.blocks.toFixed(1)}</td>
                  <td className="p-3">{stats.turnovers.toFixed(1)}</td>
                  <td className="p-3 font-bold">{stats.swish_score.toFixed(2)}</td>
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Opponent</th>
                <th className="p-3">Result</th>
                <th className="p-3">MIN</th>
                <th className="p-3">PTS</th>
                <th className="p-3">REB</th>
                <th className="p-3">AST</th>
                <th className="p-3">STL</th>
                <th className="p-3">BLK</th>
                <th className="p-3">TOV</th>
              </tr>
            </thead>
            <tbody>
              {gameLogs.map((log, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-3">{new Date(log.game_date).toLocaleDateString()}</td>
                  <td className="p-3">{log.opponent}</td>
                  <td className={`p-3 font-bold ${log.win_loss === 'W' ? 'text-green-400' : 'text-red-400'}`}>{log.win_loss}</td>
                  <td className="p-3">{log.minutes_played}</td>
                  <td className="p-3">{log.points}</td>
                  <td className="p-3">{log.rebounds}</td>
                  <td className="p-3">{log.assists}</td>
                  <td className="p-3">{log.steals}</td>
                  <td className="p-3">{log.blocks}</td>
                  <td className="p-3">{log.turnovers}</td>
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
