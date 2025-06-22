import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // Fetch all season entries from the table
    const { data, error } = await supabase
      .from('player_stats_by_season')
      .select('season');

    if (error) {
      throw error;
    }

    if (!data) {
        return NextResponse.json([], { status: 200 });
    }

    // Create a unique set of seasons from the fetched data
    const seasons = [...new Set(data.map(item => item.season))];

    // Sort seasons descending
    seasons.sort((a, b) => b.localeCompare(a));

    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Error fetching seasons from Supabase:', error);
    return NextResponse.json({ message: 'Error fetching seasons data' }, { status: 500 });
  }
}
