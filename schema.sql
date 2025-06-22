-- Schema for the Swishlytics database

-- Players Table: Stores unique information about each player.
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nba_com_id BIGINT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player Stats by Season Table: Stores aggregated seasonal stats for each player.
CREATE TABLE IF NOT EXISTS player_stats_by_season (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    team_abbreviation TEXT,
    player_age INTEGER,
    games_played INTEGER,
    games_started INTEGER,
    minutes_played NUMERIC,
    field_goals_made NUMERIC,
    field_goals_attempted NUMERIC,
    field_goal_percentage NUMERIC,
    three_pointers_made NUMERIC,
    three_pointers_attempted NUMERIC,
    three_point_percentage NUMERIC,
    free_throws_made NUMERIC,
    free_throws_attempted NUMERIC,
    free_throw_percentage NUMERIC,
    offensive_rebounds NUMERIC,
    defensive_rebounds NUMERIC,
    total_rebounds NUMERIC,
    assists NUMERIC,
    steals NUMERIC,
    blocks NUMERIC,
    turnovers NUMERIC,
    personal_fouls NUMERIC,
    points NUMERIC,
    true_shooting_percentage NUMERIC,
    usage_percentage NUMERIC,
    swish_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- Game Logs Table: Stores individual game statistics for each player.
CREATE TABLE IF NOT EXISTS game_logs (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    game_id BIGINT UNIQUE NOT NULL,
    game_date DATE NOT NULL,
    season TEXT NOT NULL,
    matchup TEXT,
    outcome TEXT,
    minutes_played NUMERIC,
    points NUMERIC,
    field_goals_made NUMERIC,
    field_goals_attempted NUMERIC,
    three_pointers_made NUMERIC,
    three_pointers_attempted NUMERIC,
    free_throws_made NUMERIC,
    free_throws_attempted NUMERIC,
    total_rebounds NUMERIC,
    assists NUMERIC,
    steals NUMERIC,
    blocks NUMERIC,
    turnovers NUMERIC,
    personal_fouls NUMERIC,
    plus_minus INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
