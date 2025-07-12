-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for storing player information
CREATE TABLE players (
    player_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL UNIQUE,
    nba_player_id INT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for storing player stats by season
CREATE TABLE player_stats_by_season (
    stat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    player_age INT,
    team TEXT,
    games_played INT,
    avg_minutes FLOAT,
    points FLOAT,
    rebounds FLOAT,
    assists FLOAT,
    steals FLOAT,
    blocks FLOAT,
    turnovers FLOAT,
    field_goal_pct FLOAT,
    free_throw_pct FLOAT,
    three_point_pct FLOAT,
    three_pointers_made FLOAT,
    three_point_attempts FLOAT,
    field_goals_made FLOAT,
    field_goal_attempts FLOAT,
    free_throws_made FLOAT,
    free_throw_attempts FLOAT,
    true_shooting_pct FLOAT,
    usage_rate FLOAT,
    points_z_score FLOAT,
    rebounds_z_score FLOAT,
    assists_z_score FLOAT,
    steals_z_score FLOAT,
    blocks_z_score FLOAT,
    field_goal_pct_z_score FLOAT,
    three_pointers_made_z_score FLOAT,
    free_throw_pct_z_score FLOAT,
    turnovers_z_score FLOAT,
    swish_score FLOAT,
    overall_rank INT,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Ensure each player has only one entry per season
    UNIQUE(player_id, season)
);

-- Table for storing player projections for the next season
CREATE TABLE player_projections (
    projection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    full_name TEXT,
    team TEXT,
    player_age INT,
    games_played FLOAT,
    avg_minutes FLOAT,
    points FLOAT,
    rebounds FLOAT,
    assists FLOAT,
    steals FLOAT,
    blocks FLOAT,
    turnovers FLOAT,
    field_goal_pct FLOAT,
    free_throw_pct FLOAT,
    three_pointers_made FLOAT,
    three_point_attempts FLOAT, -- Added
    field_goals_made FLOAT, -- Added
    field_goal_attempts FLOAT, -- Added
    free_throws_made FLOAT, -- Added
    free_throw_attempts FLOAT, -- Added
    true_shooting_pct FLOAT,
    usage_rate FLOAT,
    points_z_score FLOAT,
    rebounds_z_score FLOAT,
    assists_z_score FLOAT,
    steals_z_score FLOAT,
    blocks_z_score FLOAT,
    turnovers_z_score FLOAT, -- Note: inverted
    field_goal_pct_z_score FLOAT,
    free_throw_pct_z_score FLOAT,
    three_pointers_made_z_score FLOAT,
    swish_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(player_id, season)
);

-- Table for future use: storing individual game logs
CREATE TABLE game_logs (
    game_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    game_date DATE NOT NULL,
    opponent TEXT,
    win_loss TEXT,
    minutes_played FLOAT,
    field_goals_made INT,
    field_goal_attempts INT,
    field_goal_percentage FLOAT,
    three_pointers_made INT,
    three_point_attempts INT,
    three_point_percentage FLOAT,
    free_throws_made INT,
    free_throw_attempts INT,
    free_throw_percentage FLOAT,
    rebounds INT,
    assists INT,
    steals INT,
    blocks INT,
    turnovers INT,
    points INT,
    plus_minus INT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(player_id, game_date)
);
