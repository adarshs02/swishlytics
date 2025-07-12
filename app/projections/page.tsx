"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Table1 from "../components/table1";

// Type for player projection data
interface PlayerProjection {
  [key: string]: any; // For dynamic key access
  rank?: number;
  player_id: string;
  full_name: string;
  team: string;
  games_played: number;
  avg_minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  field_goal_pct: number;
  free_throw_pct: number;
  three_pointers_made: number;
  three_point_attempts: number;
  field_goals_made: number;
  field_goal_attempts: number;
  free_throws_made: number;
  free_throw_attempts: number;
  usage_rate: number;
  true_shooting_pct: number;
  swish_score: number;
  points_z_score?: number;
  rebounds_z_score?: number;
  assists_z_score?: number;
  steals_z_score?: number;
  blocks_z_score?: number;
  turnovers_z_score?: number;
  field_goal_pct_z_score?: number;
  free_throw_pct_z_score?: number;
  three_pointers_made_z_score?: number;
}

type SortKey = keyof PlayerProjection;

// Main component for the projections page
export default function ProjectionsPage() {
  // State for data, loading, errors, and sorting
  const [data, setData] = useState<PlayerProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "rank", direction: "asc" });

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/projections");
        if (!res.ok) {
          throw new Error("Failed to fetch projections from the server.");
        }
        const json: PlayerProjection[] = await res.json();

        // Assign rank based on default sort (swish_score descending)
        const rankedData = [...json]
          .sort((a, b) => b.swish_score - a.swish_score)
          .map((p, i) => ({ ...p, rank: i + 1 }));

        setData(rankedData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Could not load projection data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Memoized sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? -Infinity;
      const bVal = b[sortConfig.key] ?? -Infinity;
      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Handle sort requests from table headers
  const requestSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Display sort direction indicator
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "🔼" : "🔽";
  };

  // Function to determine cell style based on z-score with scaling intensity
  const getStatCellStyle = (player: PlayerProjection, statKey: keyof PlayerProjection): React.CSSProperties => {
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

    const zScoreKey = `${String(statKey)}_z_score` as keyof PlayerProjection;
    const zScore = player[zScoreKey];

    if (typeof zScore !== 'number') {
      return {};
    }

    // Define a max z-score for scaling. Scores beyond this will have max color intensity.
    const maxZScore = 2.5;
    let color = '';

    // Invert colors for turnovers, where a high z-score is bad.
    const isNegativeStat = statKey === 'turnovers';

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

  // Format stat values for display
  const formatStat = (value: any, key: string) => {
    if (value == null || value === undefined) return "-";
    if (key === 'rank' || key === 'games_played') {
        return Math.round(value);
    }
    if (["field_goal_pct", "free_throw_pct", "true_shooting_pct", "usage_rate"].includes(key)) {
      return `${(Number(value) * 100).toFixed(1)}%`;
    }
    if (typeof value === "number") {
      return value.toFixed(key === "swish_score" ? 2 : 1);
    }
    return String(value);
  };

  // Column definitions for the table
  const columns: { key: SortKey; label: string, isSortable: boolean }[] = [
    { key: "rank", label: "Rank", isSortable: true },
    { key: "full_name", label: "Player", isSortable: true },
    { key: "team", label: "Team", isSortable: true },
    { key: "games_played", label: "GP", isSortable: true },
    { key: "avg_minutes", label: "MIN", isSortable: true },
    { key: "points", label: "PTS", isSortable: true },
    { key: "rebounds", label: "REB", isSortable: true },
    { key: "assists", label: "AST", isSortable: true },
    { key: "steals", label: "STL", isSortable: true },
    { key: "blocks", label: "BLK", isSortable: true },
    { key: "turnovers", label: "TOV", isSortable: true },
    { key: "field_goal_pct", label: "FG%", isSortable: true },
    { key: "free_throw_pct", label: "FT%", isSortable: true },
    { key: "three_pointers_made", label: "3PM", isSortable: true },
    { key: "three_point_attempts", label: "3PA", isSortable: true },
    { key: "field_goals_made", label: "FGM", isSortable: true },
    { key: "field_goal_attempts", label: "FGA", isSortable: true },
    { key: "free_throws_made", label: "FTM", isSortable: true },
    { key: "free_throw_attempts", label: "FTA", isSortable: true },
    { key: "usage_rate", label: "Usage", isSortable: true },
    { key: "true_shooting_pct", label: "TS%", isSortable: true },
    { key: "swish_score", label: "Swish Score", isSortable: true },
  ];

  const renderCell = (item: PlayerProjection, columnKey: keyof PlayerProjection) => {
    const keyStr = String(columnKey);
    if (keyStr === "full_name") {
      return (
        <Link href={`/player/${item.player_id}`} className="text-blue-600 hover:underline">
          {item.full_name}
        </Link>
      );
    }

    if (keyStr === 'team') {
        return formatStat(item[keyStr], keyStr);
    }

    return <span className="font-bold">{formatStat(item[keyStr], keyStr)}</span>;
  };

  // Render logic
  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading projections...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <>
      <header>
        <h1>Swishlytics</h1>
      </header>

      <main>
        <h2 id="current-ranking-title">
            Player Projections for 2025-2026 Season
        </h2>
        <Table1
            columns={columns}
            data={sortedData}
            renderCell={renderCell}
            onHeaderClick={requestSort}
            getSortIndicator={getSortIndicator}
            getCellStyle={getStatCellStyle}
        />
      </main>
      <footer>
        <p>&copy; 2025 Swishlytics</p>
      </footer>
    </>
  );
}
