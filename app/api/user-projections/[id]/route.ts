import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Key must be defined in .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch a specific user projection
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('user_projections')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse(
          JSON.stringify({ error: 'Projection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
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

// PUT - Update a user projection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.players || body.players.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Name and at least one player are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fantasy scores for updated players
    const playersWithScores = body.players.map((player: any) => ({
      ...player,
      fantasy_score: calculateFantasyScore(player.stats)
    }));

    const updateData = {
      name: body.name,
      description: body.description || '',
      players_data: playersWithScores,
      updated_at: new Date().toISOString(),
      player_count: playersWithScores.length
    };

    const { data, error } = await supabase
      .from('user_projections')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse(
          JSON.stringify({ error: 'Projection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
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

// DELETE - Delete a user projection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('user_projections')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ message: 'Projection deleted successfully' });
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to calculate fantasy score (same as in main route)
function calculateFantasyScore(stats: any): number {
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
