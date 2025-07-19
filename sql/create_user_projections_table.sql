-- Create user_projections table for storing admin-created custom projections
CREATE TABLE IF NOT EXISTS user_projections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    players_data JSONB NOT NULL, -- Store array of player objects with stats
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    player_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_projections_created_by ON user_projections(created_by);
CREATE INDEX IF NOT EXISTS idx_user_projections_created_at ON user_projections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projections_active ON user_projections(is_active);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE user_projections ENABLE ROW LEVEL SECURITY;

-- Example policy for admin access only (uncomment if needed)
-- CREATE POLICY "Admin can manage user projections" ON user_projections
--     FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_projections_updated_at
    BEFORE UPDATE ON user_projections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_projections IS 'Stores custom player projections created by admin users';
COMMENT ON COLUMN user_projections.players_data IS 'JSONB array containing player objects with stats and fantasy scores';
COMMENT ON COLUMN user_projections.player_count IS 'Number of players in this projection for quick filtering';
COMMENT ON COLUMN user_projections.is_active IS 'Flag to soft-delete projections without removing data';
