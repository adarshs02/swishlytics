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
  usage_rate: number;
  field_goals_made: number;
  field_goal_attempts: number;
  three_pointers_made: number;
  three_point_attempts: number;
  free_throws_made: number;
  free_throw_attempts: number;
  true_shooting_pct: number;
  field_goal_pct: number;
  free_throw_pct: number;
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
    let zScore;
    if (statKey === 'swish_score') {
      zScore = player.swish_score;
    } else {
      const zScoreKey = `${statKey}_z_score`;
      zScore = player[zScoreKey];
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
            <table id="rankings-table" className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
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
                  <th onClick={() => requestSort('field_goal_pct')} className="px-4 py-2 cursor-pointer">FG% {getSortIndicator('field_goal_pct')}</th>
                  <th onClick={() => requestSort('free_throw_pct')} className="px-4 py-2 cursor-pointer">FT% {getSortIndicator('free_throw_pct')}</th>
                  <th onClick={() => requestSort('three_pointers_made')} className="px-4 py-2 cursor-pointer">3PM {getSortIndicator('three_pointers_made')}</th>
                  <th onClick={() => requestSort('three_point_attempts')} className="px-4 py-2 cursor-pointer">3PA {getSortIndicator('three_point_attempts')}</th>
                  <th onClick={() => requestSort('field_goals_made')} className="px-4 py-2 cursor-pointer">FGM {getSortIndicator('field_goals_made')}</th>
                  <th onClick={() => requestSort('field_goal_attempts')} className="px-4 py-2 cursor-pointer">FGA {getSortIndicator('field_goal_attempts')}</th>
                  <th onClick={() => requestSort('free_throws_made')} className="px-4 py-2 cursor-pointer">FTM {getSortIndicator('free_throws_made')}</th>
                  <th onClick={() => requestSort('free_throw_attempts')} className="px-4 py-2 cursor-pointer">FTA {getSortIndicator('free_throw_attempts')}</th>
                  <th onClick={() => requestSort('usage_rate')} className="px-4 py-2 cursor-pointer">Usage {getSortIndicator('usage_rate')}</th>
                  <th onClick={() => requestSort('true_shooting_pct')} className="px-4 py-2 cursor-pointer">TS% {getSortIndicator('true_shooting_pct')}</th>
                  <th onClick={() => requestSort('swish_score')} className="px-4 py-2 cursor-pointer">Swish Score {getSortIndicator('swish_score')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr key="loading"><td colSpan={22} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : error ? (
                  <tr key="error"><td colSpan={22} style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
                ) : sortedRankings.length > 0 ? (
                  sortedRankings.map((player) => (
                    <tr key={player.player_id}>
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
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'field_goal_pct')}>{typeof player.field_goal_pct === 'number' ? (player.field_goal_pct * 100).toFixed(1) + '%' : 'N/A'}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'free_throw_pct')}>{typeof player.free_throw_pct === 'number' ? (player.free_throw_pct * 100).toFixed(1) + '%' : 'N/A'}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'three_pointers_made')}>{formatStat(player.three_pointers_made)}</td>
                      <td className="border-t px-4 py-2 font-bold">{formatStat(player.three_point_attempts)}</td>
                      <td className="border-t px-4 py-2 font-bold">{formatStat(player.field_goals_made)}</td>
                      <td className="border-t px-4 py-2 font-bold">{formatStat(player.field_goal_attempts)}</td>
                      <td className="border-t px-4 py-2 font-bold">{formatStat(player.free_throws_made)}</td>
                      <td className="border-t px-4 py-2 font-bold">{formatStat(player.free_throw_attempts)}</td>
                      <td className="border-t px-4 py-2 font-bold">{typeof player.usage_rate === 'number' ? (player.usage_rate * 100).toFixed(1) + '%' : 'N/A'}</td>
                      <td className="border-t px-4 py-2 font-bold">{typeof player.true_shooting_pct === 'number' ? (player.true_shooting_pct * 100).toFixed(1) + '%' : 'N/A'}</td>
                      <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'swish_score')}>{typeof player.swish_score === 'number' ? player.swish_score.toFixed(2) : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-data"><td colSpan={22} style={{ textAlign: 'center' }}>No data available for this season.</td></tr>
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
