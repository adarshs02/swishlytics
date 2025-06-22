import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ player_id: string }> }) {
  const { player_id } = await params;

  if (!player_id) {
    return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
  }

  try {
    // Fetch player's full name and all their seasonal stats
    const { data, error } = await supabase
      .from('players')
      .select(`
        full_name,
        player_stats_by_season (*)
      `)
      .eq('player_id', player_id)
      .single(); // We expect only one player for a given UUID

    if (error) {
      console.error('Error fetching player details:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error fetching details for player ${player_id}:`, error);
    return NextResponse.json({ error: `Failed to fetch details for player ${player_id}` }, { status: 500 });
  }
}
