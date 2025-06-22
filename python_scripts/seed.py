import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# --- DATABASE SETUP ---
# Initialize Supabase client
load_dotenv()
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase URL and service key must be set in the python_scripts/.env file.")

supabase: Client = create_client(url, key)

def seed_data(df):
    """Seeds the Supabase database with a combined DataFrame of player stats."""
    print("Step 4: Seeding data to Supabase...")

    # 1. Upsert players into the 'players' table
    player_id_mapping = df.drop_duplicates(subset=['PlayerName']).set_index('PlayerName')['PlayerID'].to_dict()
    player_records = [{'full_name': name, 'nba_player_id': player_id_mapping.get(name)} for name in df['PlayerName'].unique()]
    
    print(f"  Upserting {len(player_records)} unique players...")
    try:
        supabase.table('players').upsert(player_records, on_conflict='full_name').execute()
        print("    -> Players upserted successfully.")
    except Exception as e:
        print(f"    -> FATAL: Error upserting players: {e}")
        return

    # 2. Fetch player IDs to map names to foreign keys
    print("  Fetching player IDs for foreign key mapping...")
    try:
        all_players_response = supabase.table('players').select('player_id, full_name').in_('full_name', df['PlayerName'].unique().tolist()).execute()
        player_id_map = {p['full_name']: p['player_id'] for p in all_players_response.data}
        df['player_id'] = df['PlayerName'].map(player_id_map)
        print(f"    -> Successfully mapped {len(df) - df['player_id'].isna().sum()} of {len(df)} players to IDs.")
    except Exception as e:
        print(f"    -> FATAL: Error fetching player IDs: {e}")
        return

    # 3. Prepare and upsert player stats data
    column_mapping = {
        'PlayerAge': 'player_age', 'Team': 'team', 'GamesPlayed': 'games_played', 'AvgMinutes': 'avg_minutes',
        'Points': 'points', 'Rebounds': 'rebounds', 'Assists': 'assists', 'Steals': 'steals', 'Blocks': 'blocks',
        'Turnovers': 'turnovers', 'FieldGoalPct': 'field_goal_pct', 'FreeThrowPct': 'free_throw_pct',
        'ThreePointPct': 'three_point_pct', 'ThreePointersMade': 'three_pointers_made', 'ThreePointAttempts': 'three_point_attempts',
        'FieldGoalsMade': 'field_goals_made', 'FieldGoalAttempts': 'field_goal_attempts', 'FreeThrowsMade': 'free_throws_made',
        'FreeThrowAttempts': 'free_throw_attempts', 'TrueShootingPct': 'true_shooting_pct', 'UsageRate': 'usage_rate',
        'Points_ZScore': 'points_z_score', 'Rebounds_ZScore': 'rebounds_z_score', 'Assists_ZScore': 'assists_z_score',
        'Steals_ZScore': 'steals_z_score', 'Blocks_ZScore': 'blocks_z_score', 'FieldGoalPct_ZScore': 'field_goal_pct_z_score',
        'ThreePointersMade_ZScore': 'three_pointers_made_z_score', 'FreeThrowPct_ZScore': 'free_throw_pct_z_score',
        'Turnovers_ZScore': 'turnovers_z_score', 'Swish_Score': 'swish_score', 'Overall_Rank': 'overall_rank',
        'player_id': 'player_id', 'Season': 'season'
    }
    
    cols_to_select = [col for col in column_mapping.keys() if col in df.columns]
    stats_df = df[cols_to_select].rename(columns=column_mapping)
    stats_records = stats_df.to_dict('records')

    print(f"  Upserting {len(stats_records)} player stat records...")
    try:
        chunk_size = 500
        for i in range(0, len(stats_records), chunk_size):
            chunk = stats_records[i:i + chunk_size]
            supabase.table('player_stats_by_season').upsert(chunk, on_conflict='player_id, season').execute()
        print("    -> Player stats upserted successfully.")
    except Exception as e:
        print(f"    -> FATAL: Error upserting player stats: {e}")

    print("Finished seeding data.")

