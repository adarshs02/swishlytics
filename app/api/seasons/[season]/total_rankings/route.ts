import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;

  if (!season) {
    return NextResponse.json({ error: 'Season parameter is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('player_stats_by_season')
      .select(`
        player_id,
        season,
        team,
        player_age,
        games_played,
        avg_minutes,
        points,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        swish_score,
        players ( full_name ),
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
      .eq('season', season)
      .order('swish_score', { ascending: false });

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      throw new Error(error.message);
    }

    if (!data) {
        return NextResponse.json([]);
    }

    // The data from Supabase with a join is nested. We need to flatten it.
    const flattenedData = data.map(item => {
      // The Supabase client infers the joined 'players' table as an object, but to be safe with types we handle it carefully.
      const playerName = (item.players as any)?.full_name || 'Unknown Player';
      
      // We create a new object, excluding the original 'players' nested object.
      const { players, ...stats } = item;

      return {
        ...stats,
        Player: playerName,
      };
    });

    return NextResponse.json(flattenedData);

  } catch (error) {
    console.error(`Error fetching rankings for season ${season}:`, error);
    return NextResponse.json({ error: `Failed to fetch rankings for season ${season}` }, { status: 500 });
  }
}
