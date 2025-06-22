import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ player_id: string }> }) {
  const { player_id } = await params;

  if (!player_id) {
    return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('game_logs')
      .select('*')
      .eq('player_id', player_id)
      .order('game_date', { ascending: false });

    if (error) {
      console.error('Error fetching game logs:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error(`Error fetching game logs for player ${player_id}:`, error);
    return NextResponse.json({ error: `Failed to fetch game logs for player ${player_id}` }, { status: 500 });
  }
}
