import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ player_id: string }> }) {
  const { player_id } = await params;

  if (!player_id) {
    return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
  }

  try {
    // Fetch player's full name and all their seasonal stats
    const { data: player_stats, error: stats_error } = await supabase
      .from('player_stats_by_season')
      .select(`
        season,
        team,
        games_played,
        avg_minutes,
        points,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        player_age,
        field_goal_pct,
        free_throw_pct,
        three_point_pct,
        true_shooting_pct,
        three_pointers_made,
        three_point_attempts,
        field_goals_made,
        field_goal_attempts,
        free_throws_made,
        free_throw_attempts,
        usage_rate,
        swish_score,
        points_z_score,
        rebounds_z_score,
        assists_z_score,
        steals_z_score,
        blocks_z_score,
        turnovers_z_score,
        field_goal_pct_z_score,
        three_pointers_made_z_score,
        free_throw_pct_z_score
      `)
      .eq('player_id', player_id);

    if (stats_error) {
      console.error('Error fetching player stats:', stats_error);
      throw new Error(stats_error.message);
    }

    if (!player_stats || player_stats.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Fetch player's full name
    const { data: player_data, error: player_error } = await supabase
      .from('players')
      .select('full_name')
      .eq('player_id', player_id)
      .single();

    if (player_error) {
      console.error('Error fetching player details:', player_error);
      throw new Error(player_error.message);
    }

    if (!player_data) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ ...player_data, player_stats });

  } catch (error) {
    console.error(`Error fetching details for player ${player_id}:`, error);
    return NextResponse.json({ error: `Failed to fetch details for player ${player_id}` }, { status: 500 });
  }
}
