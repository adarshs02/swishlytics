"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Define a type for our player data for better type safety
interface PlayerData {
  [key: string]: any; // Keep for flexibility with dynamic keys
  player_id: string;
  Player: string;
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
  swish_rank?: number;
  points_z_score?: number;
  rebounds_z_score?: number;
  assists_z_score?: number;
  steals_z_score?: number;
  blocks_z_score?: number;
  turnovers_z_score?: number;
  field_goal_pct_z_score?: number;
  three_pointers_made_z_score?: number;
  free_throw_pct_z_score?: number;
}

export default function Home() {
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [rankings, setRankings] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PlayerData; direction: 'ascending' | 'descending' } | null>({ key: 'swish_rank', direction: 'ascending' });

  // Effect to fetch available seasons on initial load
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const response = await fetch('/api/seasons');
        if (!response.ok) {
          throw new Error('Failed to fetch seasons');
        }
        const data = await response.json();
        setSeasons(data);
        if (data.length > 0) {
          setSelectedSeason(data[0]); // Default to the most recent season
        }
      } catch (err) {
        setError('Could not load season data.');
        console.error(err);
      }
    };

    fetchSeasons();
  }, []);

  // Effect to fetch rankings when the selected season changes
  useEffect(() => {
    if (!selectedSeason) return;

    const fetchRankings = async () => {
      setIsLoading(true);
      setError(null);
      setRankings([]); // Clear previous rankings
      try {
        const response = await fetch(`/api/seasons/${selectedSeason}/total_rankings`);
        if (!response.ok) {
          throw new Error(`Failed to fetch rankings for ${selectedSeason}`);
        }
        const data = await response.json();
        // Sort by swish_score to determine rank
        const rankedData = [...data].sort((a, b) => (b.swish_score || 0) - (a.swish_score || 0));
        // Add the rank to each player object
        const dataWithRank = rankedData.map((player, index) => ({
          ...player,
          swish_rank: index + 1,
        }));
        setRankings(dataWithRank);
      } catch (err) {
        setError(`Could not load ranking data for ${selectedSeason}.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [selectedSeason]);

  const sortedRankings = useMemo(() => {
    let sortableItems = [...rankings];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        // Handle cases where values might be undefined to satisfy TypeScript
        if (valA === undefined || valB === undefined) {
            if (valA === undefined && valB !== undefined) return 1;
            if (valA !== undefined && valB === undefined) return -1;
            return 0;
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [rankings, sortConfig]);

  const requestSort = (key: keyof PlayerData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const formatStat = (value: number | string) => {
    if (typeof value === 'number') {
        return value.toFixed(1);
    }
    return 'N/A';
  };

  const getStatCellStyle = (player: PlayerData, statKey: keyof PlayerData): React.CSSProperties => {
    const zScoreKey = `${statKey}_z_score`;
    const zScore = player[zScoreKey];

    if (typeof zScore !== 'number') {
      return {}; // No specific style if z-score is not available
    }

    // Turnovers are bad, so we invert the color scale
    const isBadStat = statKey === 'turnovers';
    const effectiveZ = isBadStat ? -zScore : zScore;

    // Clamp the z-score to a [-2, 2] range for a reasonable color scale
    const clampedZ = Math.max(-2, Math.min(2, effectiveZ));

    // Normalize the clamped z-score to a [0, 1] range
    const normalizedZ = (clampedZ + 2) / 4;

    // Interpolate the hue value from red (0) to green (120)
    const hue = normalizedZ * 120;

    // Decrease the base lightness and increase the z-score multiplier for more intense colors
    const lightness = 85 - Math.abs(zScore) * 9;

    return {
      backgroundColor: `hsl(${hue}, 90%, ${lightness}%)`, // Increased saturation to 90%
      color: 'black',
      fontWeight: 'bold',
    };
  };

  const getSortIndicator = (for_key: keyof PlayerData) => {
    if (!sortConfig || sortConfig.key !== for_key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
  };

  return (
    <>
      <header>
        <h1>Swishlytics</h1>
      </header>

      <main>
        <div className="controls-container">
          <div className="select-container">
            <label htmlFor="season-select">Select Season:</label>
            <select
              id="season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              disabled={seasons.length === 0}
            >
              {seasons.length > 0 ? (
                seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))
              ) : (
                <option>Loading seasons...</option>
              )}
            </select>
          </div>
        </div>

        <div id="rankings-table-container">
          <h2 id="current-ranking-title">
            {selectedSeason ? `Player Fantasy Rankings: ${selectedSeason}` : ''}
          </h2>
          <p style={{ textAlign: 'center', fontStyle: 'italic', margin: '1rem 0' }}>Prediction engine, matchup data, and more coming soon</p>
          <div className="table-container">
            <table id="rankings-table">
              <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                  <th onClick={() => requestSort('swish_rank')} className="px-4 py-2 cursor-pointer">Rank {getSortIndicator('swish_rank')}</th>
                  <th onClick={() => requestSort('Player')} className="px-4 py-2 cursor-pointer">Player {getSortIndicator('Player')}</th>
                  <th onClick={() => requestSort('team')} className="px-4 py-2 cursor-pointer">Team {getSortIndicator('team')}</th>
                  <th onClick={() => requestSort('games_played')} className="px-4 py-2 cursor-pointer">GP {getSortIndicator('games_played')}</th>
                  <th onClick={() => requestSort('avg_minutes')} className="px-4 py-2 cursor-pointer">MIN {getSortIndicator('avg_minutes')}</th>
                  <th onClick={() => requestSort('points')} className="px-4 py-2 cursor-pointer">PTS {getSortIndicator('points')}</th>
                  <th onClick={() => requestSort('rebounds')} className="px-4 py-2 cursor-pointer">REB {getSortIndicator('rebounds')}</th>
                  <th onClick={() => requestSort('assists')} className="px-4 py-2 cursor-pointer">AST {getSortIndicator('assists')}</th>
                  <th onClick={() => requestSort('steals')} className="px-4 py-2 cursor-pointer">STL {getSortIndicator('steals')}</th>
                  <th onClick={() => requestSort('blocks')} className="px-4 py-2 cursor-pointer">BLK {getSortIndicator('blocks')}</th>
                  <th onClick={() => requestSort('turnovers')} className="px-4 py-2 cursor-pointer">TOV {getSortIndicator('turnovers')}</th>
                  <th onClick={() => requestSort('swish_score')} className="px-4 py-2 cursor-pointer">Swish Score {getSortIndicator('swish_score')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr key="loading"><td colSpan={12} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : error ? (
                  <tr key="error"><td colSpan={12} style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
                ) : sortedRankings.length > 0 ? (
                  sortedRankings.map((player, index) => (
                    <tr key={player.Player}>
                      <td className="border-t px-4 py-2 font-bold">{player.swish_rank}</td>
                      <td className="border-t px-4 py-2">
                        <Link href={`/player/${player.player_id}`} className="text-blue-600 hover:underline">
                          {player.Player}
                        </Link>
                      </td>
                      <td className="border-t px-4 py-2">{player.team}</td>
                      <td className="border-t px-4 py-2 font-bold">{player.games_played}</td>
                      <td className="border-t px-4 py-2 font-bold">{typeof player.avg_minutes === 'number' ? player.avg_minutes.toFixed(1) : 'N/A'}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'points')}>{formatStat(player.points)}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'rebounds')}>{formatStat(player.rebounds)}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'assists')}>{formatStat(player.assists)}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'steals')}>{formatStat(player.steals)}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'blocks')}>{formatStat(player.blocks)}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'turnovers')}>{formatStat(player.turnovers)}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'swish_score')}>{typeof player.swish_score === 'number' ? player.swish_score.toFixed(2) : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-data"><td colSpan={12} style={{ textAlign: 'center' }}>No data available for this season.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <footer>
        <p>&copy; 2025 Swishlytics</p>
      </footer>
    </>
  );
}
