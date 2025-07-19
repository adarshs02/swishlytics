import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Key must be defined in .env');
}

// Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PlayerProjection {
  id: number;
  name: string;
  position: string;
  team: string;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPercentage: number;
    freeThrowPercentage: number;
    threePointsMade: number;
  };
}

interface UserProjectionData {
  name: string;
  description: string;
  players: PlayerProjection[];
  createdBy: string;
  createdAt: string;
}

// GET - Fetch all user projections
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('user_projections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projections:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Create a new user projection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: UserProjectionData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.players || body.players.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Name and at least one player are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Apply minimum minutes filter (optional - you can adjust this)
    const MIN_MINUTES_THRESHOLD = 25;
    const validPlayers = body.players.filter(player => {
      // For now, we'll assume all manually entered players are valid
      // In the future, you might want to add minutes validation
      return player.name && player.name.trim() !== '';
    });

    if (validPlayers.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No valid players found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fantasy scores for each player (simplified version)
    const playersWithScores = validPlayers.map(player => ({
      ...player,
      fantasy_score: calculateFantasyScore(player.stats)
    }));

    // Prepare data for database insertion
    const projectionData = {
      name: body.name,
      description: body.description || '',
      players_data: playersWithScores,
      created_by: session.user?.email || 'admin',
      created_at: new Date().toISOString(),
      player_count: playersWithScores.length
    };

    const { data, error } = await supabase
      .from('user_projections')
      .insert([projectionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user projection:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to calculate a basic fantasy score
function calculateFantasyScore(stats: PlayerProjection['stats']): number {
  // Simplified fantasy scoring - you can adjust weights as needed
  const weights = {
    points: 1.0,
    rebounds: 1.2,
    assists: 1.5,
    steals: 3.0,
    blocks: 3.0,
    turnovers: -1.0,
    threePointsMade: 3.0
  };

  return (
    stats.points * weights.points +
    stats.rebounds * weights.rebounds +
    stats.assists * weights.assists +
    stats.steals * weights.steals +
    stats.blocks * weights.blocks +
    stats.turnovers * weights.turnovers +
    stats.threePointsMade * weights.threePointsMade
  );
}
