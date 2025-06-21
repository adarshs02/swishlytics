"use client";

import React, { useState, useEffect } from 'react';

// Define a type for our player data for better type safety
interface PlayerData {
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
  Total_Fantasy_ZScore: number;
}

export default function Home() {
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [rankings, setRankings] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <header>
        <h1>Fantasy Basketball Player Predictor</h1>
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
            {selectedSeason ? `Player Total Fantasy Rankings: ${selectedSeason}` : ''}
          </h2>
          <table id="rankings-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-left">Team</th>
                <th className="px-4 py-2 text-left">GP</th>
                <th className="px-4 py-2 text-left">MIN</th>
                <th className="px-4 py-2 text-left">PTS</th>
                <th className="px-4 py-2 text-left">REB</th>
                <th className="px-4 py-2 text-left">AST</th>
                <th className="px-4 py-2 text-left">STL</th>
                <th className="px-4 py-2 text-left">BLK</th>
                <th className="px-4 py-2 text-left">TOV</th>
                <th className="px-4 py-2 text-left">FGM</th>
                <th className="px-4 py-2 text-left">FGA</th>
                <th className="px-4 py-2 text-left">FG%</th>
                <th className="px-4 py-2 text-left">3PM</th>
                <th className="px-4 py-2 text-left">3PA</th>
                <th className="px-4 py-2 text-left">3P%</th>
                <th className="px-4 py-2 text-left">FT%</th>
                <th className="px-4 py-2 text-left">TS%</th>
                <th className="px-4 py-2 text-left">USG%</th>
                <th className="px-4 py-2 text-left">Total Z-Score</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr key="loading"><td colSpan={21} style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : error ? (
                <tr key="error"><td colSpan={21} style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
              ) : rankings.length > 0 ? (
                 rankings.map((player) => (
                  <tr key={player.PlayerName}>
                    <td className="border-t px-4 py-2">{player.Overall_Rank}</td>
                    <td className="border-t px-4 py-2">{player.PlayerName}</td>
                    <td className="border-t px-4 py-2">{player.Team}</td>
                    <td className="border-t px-4 py-2">{player.GamesPlayed}</td>
                    <td className="border-t px-4 py-2">{typeof player.AvgMinutes === 'number' ? player.AvgMinutes.toFixed(1) : 'N/A'}</td>
                    <td className="border-t px-4 py-2">{player.Points}</td>
                    <td className="border-t px-4 py-2">{player.Rebounds}</td>
                    <td className="border-t px-4 py-2">{player.Assists}</td>
                    <td className="border-t px-4 py-2">{player.Steals}</td>
                    <td className="border-t px-4 py-2">{player.Blocks}</td>
                    <td className="border-t px-4 py-2">{player.Turnovers}</td>
                    <td className="border-t px-4 py-2">{player.FieldGoalsMade}</td>
                    <td className="border-t px-4 py-2">{player.FieldGoalAttempts}</td>
                    <td className="border-t px-4 py-2">{typeof player.FieldGoalPct === 'number' ? player.FieldGoalPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2">{player.ThreePointersMade}</td>
                    <td className="border-t px-4 py-2">{player.ThreePointAttempts}</td>
                    <td className="border-t px-4 py-2">{typeof player.ThreePointPct === 'number' ? player.ThreePointPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2">{typeof player.FreeThrowPct === 'number' ? player.FreeThrowPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2">{typeof player.TrueShootingPct === 'number' ? player.TrueShootingPct.toFixed(3) : 'N/A'}</td>
                    <td className="border-t px-4 py-2">{typeof player.UsageRate === 'number' ? (player.UsageRate * 100).toFixed(1) + '%' : 'N/A'}</td>
                    <td className="border-t px-4 py-2 font-semibold">{player.Total_Fantasy_ZScore}</td>
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
