import os
import time
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from nba_api.stats.endpoints import playergamelog

# --- CONFIGURATION ---
load_dotenv()

# --- DATABASE SETUP ---
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase URL and service key must be set in the .env file.")

supabase: Client = create_client(url, key)

def fetch_and_store_gamelogs():
    """Fetches game logs for all players in the database and stores them in Supabase."""
    # 1. Get all players from the database
    try:
        response = supabase.table('players').select('player_id, nba_player_id, full_name').execute()
        db_players = response.data
        if not db_players:
            print("No players found in the database. Please run the seed script first.")
            return
        print(f"Found {len(db_players)} players in the database.")
    except Exception as e:
        print(f"Error fetching players from Supabase: {e}")
        return

    # 2. Iterate through each player, get their seasons, and fetch game logs
    for player in db_players:
        player_uuid = player['player_id']
        nba_player_id = player['nba_player_id']
        player_name = player['full_name']

        if not nba_player_id:
            print(f"Skipping {player_name} (player_id: {player_uuid}) as they have no nba_player_id.")
            continue

        print(f"\n--- Processing game logs for {player_name} (NBA ID: {nba_player_id}) ---")

        try:
            # Get seasons for this player from our DB
            seasons_response = supabase.table('player_stats_by_season').select('season').eq('player_id', player_uuid).execute()
            seasons = list(set([s['season'] for s in seasons_response.data])) # Use set to get unique seasons
            
            if not seasons:
                print(f"No seasons found for {player_name} in player_stats_by_season table.")
                continue

            print(f"Found seasons: {seasons} for {player_name}. Fetching game logs...")

            all_gamelogs_df = pd.DataFrame()

            # Fetch game logs for each season
            for season in seasons:
                try:
                    gamelog = playergamelog.PlayerGameLog(player_id=nba_player_id, season=season)
                    gamelog_df = gamelog.get_data_frames()[0]
                    all_gamelogs_df = pd.concat([all_gamelogs_df, gamelog_df], ignore_index=True)
                    print(f"  - Fetched {len(gamelog_df)} logs for season {season}.")

                except Exception as e:
                    print(f"  - Error fetching logs for season {season}: {e}")
                    continue
            
            if all_gamelogs_df.empty:
                print(f"No game logs found for {player_name} across all seasons.")
                continue

            # 3. Format data for Supabase
            all_gamelogs_df['player_id'] = player_uuid
            all_gamelogs_df = all_gamelogs_df.rename(columns={
                'GAME_DATE': 'game_date',
                'MATCHUP': 'opponent',
                'WL': 'win_loss',
                'PTS': 'points',
                'REB': 'rebounds',
                'AST': 'assists',
                'STL': 'steals',
                'BLK': 'blocks',
                'TOV': 'turnovers',
                'MIN': 'minutes_played',
                'FGM': 'field_goals_made',
                'FGA': 'field_goal_attempts',
                'FG_PCT': 'field_goal_percentage',
                'FG3M': 'three_pointers_made',
                'FG3A': 'three_point_attempts',
                'FG3_PCT': 'three_point_percentage',
                'FTM': 'free_throws_made',
                'FTA': 'free_throw_attempts',
                'FT_PCT': 'free_throw_percentage',
                'PLUS_MINUS': 'plus_minus'
            })

            # Convert GAME_DATE to a standard format
            all_gamelogs_df['game_date'] = pd.to_datetime(all_gamelogs_df['game_date'], format='%b %d, %Y').dt.strftime('%Y-%m-%d')

            db_cols = [
                'player_id', 'game_date', 'opponent', 'win_loss', 'minutes_played', 
                'field_goals_made', 'field_goal_attempts', 'field_goal_percentage', 
                'three_pointers_made', 'three_point_attempts', 'three_point_percentage', 
                'free_throws_made', 'free_throw_attempts', 'free_throw_percentage', 
                'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'points', 'plus_minus'
            ]
            
            gamelogs_records = all_gamelogs_df[[col for col in db_cols if col in all_gamelogs_df.columns]].to_dict('records')

            # 4. Upsert game logs into the database
            print(f"Upserting {len(gamelogs_records)} total game logs for {player_name}...")
            chunk_size = 500
            for i in range(0, len(gamelogs_records), chunk_size):
                chunk = gamelogs_records[i:i + chunk_size]
                supabase.table('game_logs').upsert(chunk, on_conflict='player_id, game_date').execute()
            
            print(f"Successfully upserted game logs for {player_name}.")

        except Exception as e:
            print(f"An error occurred while processing {player_name}: {e}")
            continue

if __name__ == "__main__":
    fetch_and_store_gamelogs()
    print("\nGame log fetching process finished.")
