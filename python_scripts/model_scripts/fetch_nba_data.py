import pandas as pd
from nba_api.stats.endpoints import playergamelog, commonallplayers, leaguedashplayerstats
from nba_api.stats.static import players
import time
import os

# --- Configuration ---
# Determine the last 5 completed seasons. 
# If current date is June 2025, the 2024-25 season just finished.
# Seasons are typically represented as 'YYYY-YY', e.g., '2023-24'.
CURRENT_YEAR = 2025 # Assuming the task is run in mid-2025
SEASONS = [
    f"{year}-{str(year+1)[-2:]}" for year in range(CURRENT_YEAR - 10, CURRENT_YEAR)
]
# SEASONS will be: ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25']

MIN_GAMES_PLAYED = 20
MIN_AVG_MINUTES = 25.0
OUTPUT_CSV_FILENAME = 'nba_player_stats_last_10_years.csv'
DATA_DIR = '../data'
OUTPUT_FILE_PATH = os.path.join(DATA_DIR, OUTPUT_CSV_FILENAME)

REQUEST_TIMEOUT = 30  # seconds for nba_api requests
REQUEST_DELAY = 0.6   # seconds between API calls to be polite

def get_player_stats_for_season(season):
    """Fetches base and advanced player statistics for a given season and merges them."""
    print(f"Fetching Base stats for season: {season}...")
    base_df = pd.DataFrame()
    advanced_df = pd.DataFrame()

    try:
        # Fetch Base stats (PerGame)
        player_stats_base = leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            per_mode_detailed='PerGame',
            measure_type_detailed_defense='Base', # Explicitly Base
            timeout=REQUEST_TIMEOUT
        )
        time.sleep(REQUEST_DELAY)
        base_df = player_stats_base.get_data_frames()[0]
        print(f"Fetched {len(base_df)} players' base stats for {season}.")
    except Exception as e:
        print(f"Error fetching Base stats for season {season}: {e}")
        # Continue to try fetching advanced stats even if base fails, or handle differently

    print(f"Fetching Advanced stats for season: {season}...")
    try:
        # Fetch Advanced stats (PerGame)
        player_stats_advanced = leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            per_mode_detailed='PerGame',
            measure_type_detailed_defense='Advanced', # Fetch Advanced stats
            timeout=REQUEST_TIMEOUT
        )
        time.sleep(REQUEST_DELAY)
        advanced_df = player_stats_advanced.get_data_frames()[0]
        print(f"Fetched {len(advanced_df)} players' advanced stats for {season}.")
    except Exception as e:
        print(f"Error fetching Advanced stats for season {season}: {e}")

    if base_df.empty and advanced_df.empty:
        print(f"No data (base or advanced) could be fetched for season {season}.")
        return pd.DataFrame()
    elif base_df.empty:
        print(f"Only advanced stats fetched for {season}. Required base stats (GP, MIN) might be missing.")
        # Depending on requirements, you might want to return advanced_df or an empty df
        # For now, let's return advanced if base is empty, but filtering later might fail
        return advanced_df 
    elif advanced_df.empty:
        print(f"Only base stats fetched for {season}. Advanced stats will be missing.")
        return base_df # Return base if advanced is empty

    # Merge base and advanced stats
    # We need common columns to merge on, typically PLAYER_ID and TEAM_ID (if stats are team-specific per player)
    # LeagueDashPlayerStats should have PLAYER_ID. Let's select key columns from advanced_df to avoid too many duplicates.
    cols_to_merge = ['PLAYER_ID', 'TS_PCT', 'USG_PCT'] # Add other advanced stats as needed
    # Ensure TEAM_ID is also considered if a player played for multiple teams and stats are split
    # However, LeagueDashPlayerStats usually aggregates if not split by team in query
    
    # Keep only necessary advanced stats plus PLAYER_ID for merging
    advanced_df_subset = advanced_df[['PLAYER_ID'] + [col for col in cols_to_merge if col in advanced_df.columns and col != 'PLAYER_ID']]
    
    merged_df = pd.merge(base_df, advanced_df_subset, on='PLAYER_ID', how='left', suffixes=('', '_adv'))
    print(f"Merged base and advanced stats for {season}. Resulting shape: {merged_df.shape}")
    return merged_df

def main():
    """Main function to fetch, filter, and save player data."""
    all_seasons_data = []

    for season in SEASONS:
        season_stats_df = get_player_stats_for_season(season)

        if season_stats_df.empty:
            print(f"No data retrieved for season {season}. Skipping.")
            continue

        # Filter players based on criteria
        # Ensure columns exist before filtering
        required_cols = ['GP', 'MIN']
        if not all(col in season_stats_df.columns for col in required_cols):
            print(f"Missing required columns {required_cols} in data for season {season}. Skipping filters for this season.")
            # Potentially add all data if columns are missing, or skip season entirely
            # For now, let's add a season column and append if basic player info is there
            if 'PLAYER_NAME' in season_stats_df.columns:
                 season_stats_df['SEASON'] = season
                 all_seasons_data.append(season_stats_df)
            continue

        # Convert GP and MIN to numeric, coercing errors to NaN, then fill NaN with 0
        season_stats_df['GP'] = pd.to_numeric(season_stats_df['GP'], errors='coerce').fillna(0)
        season_stats_df['MIN'] = pd.to_numeric(season_stats_df['MIN'], errors='coerce').fillna(0)

        filtered_df = season_stats_df[
            (season_stats_df['GP'] >= MIN_GAMES_PLAYED) &
            (season_stats_df['MIN'] > MIN_AVG_MINUTES)
        ].copy()

        if filtered_df.empty:
            print(f"No players met the criteria for season {season}.")
            continue
        
        # Add season information to the DataFrame
        filtered_df['SEASON'] = season
        all_seasons_data.append(filtered_df)
        print(f"Processed {len(filtered_df)} players for season {season}.")

    if not all_seasons_data:
        print("No data collected across all seasons. Exiting.")
        return

    # Concatenate all dataframes
    final_df = pd.concat(all_seasons_data, ignore_index=True)

    # Select and rename columns for clarity (adjust as needed)
    # Check available columns from one of the dataframes if unsure
    # print(all_seasons_data[0].columns) # Uncomment to see available columns
    columns_to_keep = {
        'PLAYER_ID': 'PlayerID',
        'PLAYER_NAME': 'PlayerName',
        'TEAM_ABBREVIATION': 'Team',
        'SEASON': 'Season',
        'AGE': 'PlayerAge',
        'GP': 'GamesPlayed',
        'MIN': 'AvgMinutes',
        'PTS': 'Points',
        'REB': 'Rebounds',
        'AST': 'Assists',
        'STL': 'Steals',
        'BLK': 'Blocks',
        'TOV': 'Turnovers',
        'FG_PCT': 'FieldGoalPct',
        'FT_PCT': 'FreeThrowPct',
        'FG3_PCT': 'ThreePointPct',
        'FG3M': 'ThreePointersMade',
        'FG3A': 'ThreePointAttempts',
        'FGM': 'FieldGoalsMade',
        'FGA': 'FieldGoalAttempts',
        'FTM': 'FreeThrowsMade',
        'FTA': 'FreeThrowAttempts',
        'TOV': 'Turnovers',
        'TS_PCT': 'TrueShootingPct',
        'USG_PCT': 'UsageRate'
    }
    
    # Filter to keep only existing columns and rename
    existing_columns_to_keep = {k: v for k, v in columns_to_keep.items() if k in final_df.columns}
    final_df = final_df[list(existing_columns_to_keep.keys())]
    final_df = final_df.rename(columns=existing_columns_to_keep)

    # Ensure PlayerAge is a clean integer type
    if 'PlayerAge' in final_df.columns:
        final_df['PlayerAge'] = pd.to_numeric(final_df['PlayerAge'], errors='coerce').fillna(0).astype(int)
        print("Successfully cleaned and converted 'PlayerAge' column to integer.")
    else:
        print("Warning: 'PlayerAge' column not found after renaming. Cannot clean.")

    # Ensure data directory exists
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

    # Save to CSV
    try:
        final_df.to_csv(OUTPUT_FILE_PATH, index=False)
        print(f"Successfully saved player data to {OUTPUT_FILE_PATH}")
    except Exception as e:
        print(f"Error saving data to CSV: {e}")

if __name__ == "__main__":
    main()
    print("fetch_nba_data.py script finished execution.")
