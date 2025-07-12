import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // Fetch projections and join with player names
    const { data, error } = await supabase
      .from('player_projections')
      .select(`
        *,
        players:player_id (full_name)
      `)
      .order('swish_score', { ascending: false });

    if (error) {
      console.error('Error fetching projections:', error);
      throw new Error(error.message);
    }

    // The result from Supabase nests the player details. We can flatten this for easier use on the client.
    const flattenedData = data.map(p => {
      const { players, ...projection } = p;
      // Supabase returns the joined player as an object, not an array, if the relationship is one-to-one.
      const playerInfo = players as { full_name: string } | null;

      return {
        ...projection,
        full_name: playerInfo?.full_name || 'Unknown Player',
      };
    });

    return NextResponse.json(flattenedData);
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
