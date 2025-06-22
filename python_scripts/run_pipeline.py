"""
This script orchestrates the entire data pipeline in-memory, from fetching raw data
to seeding the final processed data into the Supabase database.

This new approach bypasses all intermediate CSV files, avoiding a persistent bug
in the environment's pandas library that caused data loss during file writes.
"""
import pandas as pd
from nba_api.stats.endpoints import leaguedashplayerstats
import time

# Import the refactored, in-memory functions
from process_and_calculate_z_scores import process_and_calc_zscores
from calculate_total_fantasy_scores import calculate_fantasy_scores
from seed import seed_data

# --- Pipeline Configuration ---
CURRENT_YEAR = 2025
SEASONS = [f"{year}-{str(year+1)[-2:]}" for year in range(CURRENT_YEAR - 10, CURRENT_YEAR)]
MIN_GAMES_PLAYED = 20
MIN_AVG_MINUTES = 25.0
REQUEST_TIMEOUT = 30
REQUEST_DELAY = 0.6

def fetch_player_data():
    """Fetches, filters, and cleans player data for all specified seasons."""
    print("Step 1: Fetching Player Data from NBA API...")
    all_seasons_data = []

    for season in SEASONS:
        print(f"  Fetching data for season: {season}...")
        try:
            # Fetch Base and Advanced stats
            base_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season, per_mode_detailed='PerGame', measure_type_detailed_defense='Base', timeout=REQUEST_TIMEOUT
            ).get_data_frames()[0]
            time.sleep(REQUEST_DELAY)
            advanced_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season, per_mode_detailed='PerGame', measure_type_detailed_defense='Advanced', timeout=REQUEST_TIMEOUT
            ).get_data_frames()[0]
            
            # Merge stats
            merged_df = pd.merge(base_stats, advanced_stats[['PLAYER_ID', 'TS_PCT', 'USG_PCT']], on='PLAYER_ID', how='left')
            merged_df['SEASON'] = season # Add season column
            all_seasons_data.append(merged_df)
            print(f"    -> Successfully fetched and merged data.")
        except Exception as e:
            print(f"    -> ERROR: Could not fetch data for season {season}: {e}")

    if not all_seasons_data:
        print("FATAL: No data could be fetched from the API.")
        return pd.DataFrame()

    # Combine all seasons into one DataFrame and filter
    final_df = pd.concat(all_seasons_data, ignore_index=True)
    print("Filtering players based on minimum games and minutes...")
    filtered_df = final_df[(final_df['GP'] >= MIN_GAMES_PLAYED) & (final_df['MIN'] >= MIN_AVG_MINUTES)].copy()

    # Rename columns to a consistent format
    column_renames = {
        'PLAYER_ID': 'PlayerID', 'PLAYER_NAME': 'PlayerName', 'TEAM_ABBREVIATION': 'Team',
        'SEASON': 'Season', 'AGE': 'PlayerAge', 'GP': 'GamesPlayed', 'MIN': 'AvgMinutes',
        'PTS': 'Points', 'REB': 'Rebounds', 'AST': 'Assists', 'STL': 'Steals', 'BLK': 'Blocks',
        'TOV': 'Turnovers', 'FG_PCT': 'FieldGoalPct', 'FT_PCT': 'FreeThrowPct', 'FG3_PCT': 'ThreePointPct',
        'FG3M': 'ThreePointersMade', 'FG3A': 'ThreePointAttempts', 'FGM': 'FieldGoalsMade',
        'FGA': 'FieldGoalAttempts', 'FTM': 'FreeThrowsMade', 'FTA': 'FreeThrowAttempts',
        'TS_PCT': 'TrueShootingPct', 'USG_PCT': 'UsageRate'
    }
    filtered_df.rename(columns=column_renames, inplace=True)

    # Select and reorder final columns
    final_columns = list(column_renames.values())
    filtered_df = filtered_df[final_columns]
    
    # Data cleaning
    filtered_df['PlayerAge'] = pd.to_numeric(filtered_df['PlayerAge'], errors='coerce').astype('Int64')

    print(f"Finished fetching data. Total players meeting criteria: {len(filtered_df)}")
    return filtered_df

def main():
    """Runs the full in-memory data pipeline."""
    print("--- Starting the In-Memory Data Pipeline ---")
    
    # Step 1: Fetch raw data from the API
    raw_player_df = fetch_player_data()

    if raw_player_df.empty:
        print("Pipeline halted because no data was fetched.")
        return

    # Step 2: Process data and calculate z-scores
    z_score_dataframes = process_and_calc_zscores(raw_player_df)

    # Step 3: Calculate total fantasy scores
    final_dataframes = calculate_fantasy_scores(z_score_dataframes)

    # Step 4: Seed the database
    if not final_dataframes:
        print("Pipeline halted because no data was processed for seeding.")
        return

    combined_final_df = pd.concat(final_dataframes.values(), ignore_index=True)
    seed_data(combined_final_df) 

    print("--- In-Memory Data Pipeline Completed Successfully ---")

if __name__ == '__main__':
    main()

