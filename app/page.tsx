"use client";

import React, { useState, useEffect, useMemo } from 'react';

// Define a type for our player data for better type safety
interface PlayerData {
  [key: string]: number | string | undefined;
  Overall_Rank: number;
  PlayerName: string;
  Team: string;
  GamesPlayed: number;
  AvgMinutes: number;
  Points: number;
  Rebounds: number;
  Assists: number;
  Steals: number;
  Blocks: number;
  Turnovers: number;
  FieldGoalsMade: number;
  FieldGoalAttempts: number;
  ThreePointersMade: number;
  ThreePointAttempts: number;
  FieldGoalPct: number;
  ThreePointPct: number;
  FreeThrowPct: number;
  TrueShootingPct: number;
  UsageRate: number;
  Swish_Score: number;
  Points_ZScore?: number;
  Rebounds_ZScore?: number;
  Assists_ZScore?: number;
  Steals_ZScore?: number;
  Blocks_ZScore?: number;
  Turnovers_ZScore?: number;
  FieldGoalsMade_ZScore?: number;
  FieldGoalAttempts_ZScore?: number;
  ThreePointersMade_ZScore?: number;
  ThreePointAttempts_ZScore?: number;
  FieldGoalPct_ZScore?: number;
  ThreePointPct_ZScore?: number;
  FreeThrowPct_ZScore?: number;
}

export default function Home() {
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [rankings, setRankings] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PlayerData; direction: 'ascending' | 'descending' } | null>({ key: 'Overall_Rank', direction: 'ascending' });

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
        setRankings(data);
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
    // For stats where higher is better, default to descending. For ranks/turnovers, default to ascending.
    else if (!sortConfig || sortConfig.key !== key) {
        const highIsGood = !['Overall_Rank', 'Turnovers'].includes(key as string);
        direction = highIsGood ? 'descending' : 'ascending';
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
    let zScore: number | undefined;

    if (statKey === 'Swish_Score') {
      zScore = player.Swish_Score as number | undefined;
    } else {
      const zScoreKey = `${statKey}_ZScore`;
      zScore = player[zScoreKey] as number | undefined;
    }

    if (zScore === undefined) {
      return {};
    }

    const adjustedZScore = statKey === 'Turnovers' ? -zScore : zScore;

    const maxZ = 3.0; // Cap for intensity calculation
    const minAlpha = 0.3;
    const maxAlpha = 0.95;

    const getAlpha = (score: number, threshold: number) => {
        const intensity = (Math.abs(score) - threshold) / (maxZ - threshold);
        const clampedIntensity = Math.max(0, Math.min(intensity, 1));
        return minAlpha + clampedIntensity * (maxAlpha - minAlpha);
    };

    let colorRgb = '';
    let alpha = 0;

    if (adjustedZScore > 1.5) { // Exceptionally Good (Blue)
        colorRgb = '0, 123, 255';
        alpha = getAlpha(adjustedZScore, 1.5);
    } else if (adjustedZScore > 0.5) { // Good (Green)
        colorRgb = '40, 167, 69';
        alpha = getAlpha(adjustedZScore, 0.5);
    } else if (adjustedZScore < -0.5) { // Bad (Red)
        colorRgb = '220, 53, 69';
        alpha = getAlpha(adjustedZScore, 0.5);
    } else { // Average (Yellow)
        colorRgb = '255, 193, 7';
        alpha = 0.25; // A fixed, low intensity for average stats
    }

    if (colorRgb) {
      return { backgroundColor: `rgba(${colorRgb}, ${alpha.toFixed(2)})` };
    }

    return {};
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
          <p style={{ textAlign: 'center', fontStyle: 'italic', margin: '1rem 0' }}>Prediction engine coming soon</p>
          <table id="rankings-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Overall_Rank')}>Rank{getSortIndicator('Overall_Rank')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('PlayerName')}>Player{getSortIndicator('PlayerName')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Team')}>Team{getSortIndicator('Team')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('GamesPlayed')}>GP{getSortIndicator('GamesPlayed')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('AvgMinutes')}>MIN{getSortIndicator('AvgMinutes')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Points')}>PTS{getSortIndicator('Points')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Rebounds')}>REB{getSortIndicator('Rebounds')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Assists')}>AST{getSortIndicator('Assists')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Steals')}>STL{getSortIndicator('Steals')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Blocks')}>BLK{getSortIndicator('Blocks')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Turnovers')}>TOV{getSortIndicator('Turnovers')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('FieldGoalsMade')}>FGM{getSortIndicator('FieldGoalsMade')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('FieldGoalAttempts')}>FGA{getSortIndicator('FieldGoalAttempts')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('FieldGoalPct')}>FG%{getSortIndicator('FieldGoalPct')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('ThreePointersMade')}>3PM{getSortIndicator('ThreePointersMade')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('ThreePointAttempts')}>3PA{getSortIndicator('ThreePointAttempts')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('ThreePointPct')}>3P%{getSortIndicator('ThreePointPct')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('FreeThrowPct')}>FT%{getSortIndicator('FreeThrowPct')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('TrueShootingPct')}>TS%{getSortIndicator('TrueShootingPct')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('UsageRate')}>USG%{getSortIndicator('UsageRate')}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('Swish_Score')}>Swish Score{getSortIndicator('Swish_Score')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr key="loading"><td colSpan={21} style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : error ? (
                <tr key="error"><td colSpan={21} style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
              ) : sortedRankings.length > 0 ? (
                 sortedRankings.map((player) => (
                  <tr key={player.PlayerName}>
                    <td className="border-t px-4 py-2 font-bold">{player.Overall_Rank}</td>
                    <td className="border-t px-4 py-2">{player.PlayerName}</td>
                    <td className="border-t px-4 py-2">{player.Team}</td>
                    <td className="border-t px-4 py-2 font-bold">{player.GamesPlayed}</td>
                    <td className="border-t px-4 py-2 font-bold">{typeof player.AvgMinutes === 'number' ? player.AvgMinutes.toFixed(1) : 'N/A'}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'Points')}>{formatStat(player.Points)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'Rebounds')}>{formatStat(player.Rebounds)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'Assists')}>{formatStat(player.Assists)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'Steals')}>{formatStat(player.Steals)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'Blocks')}>{formatStat(player.Blocks)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'Turnovers')}>{formatStat(player.Turnovers)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'FieldGoalsMade')}>{formatStat(player.FieldGoalsMade)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'FieldGoalAttempts')}>{formatStat(player.FieldGoalAttempts)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'FieldGoalPct')}>{typeof player.FieldGoalPct === 'number' ? player.FieldGoalPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'ThreePointersMade')}>{formatStat(player.ThreePointersMade)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'ThreePointAttempts')}>{formatStat(player.ThreePointAttempts)}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'ThreePointPct')}>{typeof player.ThreePointPct === 'number' ? player.ThreePointPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'FreeThrowPct')}>{typeof player.FreeThrowPct === 'number' ? player.FreeThrowPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2 font-bold">{typeof player.TrueShootingPct === 'number' ? player.TrueShootingPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2 font-bold">{typeof player.UsageRate === 'number' ? (player.UsageRate * 100).toFixed(1) + '%' : 'N/A'}</td>
                    <td className="border-t px-4 py-2 font-bold" style={getStatCellStyle(player, 'Swish_Score')}>{typeof player.Swish_Score === 'number' ? player.Swish_Score.toFixed(2) : 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr key="no-data"><td colSpan={21} style={{ textAlign: 'center' }}>No data available for this season.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer>
        <p>&copy; 2025 Swishlytics</p>
      </footer>
    </>
  );
}
