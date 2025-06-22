import pandas as pd
import os
import numpy as np
import glob
import re

# --- Configuration ---
DATA_DIR = '../data'
# Output directory for the combined z-score files
BASE_OUTPUT_DIR = os.path.join(DATA_DIR, 'combined_z_scores_by_season')

# Stats to calculate z-scores for
STATS_TO_NORMALIZE = [
    'Points',
    'Rebounds',
    'Assists',
    'Steals',
    'Blocks',
    'FieldGoalPct',
    'ThreePointersMade',
    'FreeThrowPct',
    'Turnovers'
]

def calculate_z_scores_for_df(df, stats):
    """
    Calculates z-scores for specified stats in a DataFrame.

    Args:
        df (pd.DataFrame): The input DataFrame with player stats.
        stats (list): A list of column names for which to calculate z-scores.

    Returns:
        pd.DataFrame: A new DataFrame with the original data plus z-score columns.
    """
    # Create a new DataFrame to hold only the z-score columns
    z_scores = pd.DataFrame(index=df.index)
    
    for stat in stats:
        if stat not in df.columns:
            print(f"    Warning: Column '{stat}' not found in DataFrame. Skipping z-score calculation for this stat.")
            continue
        if pd.api.types.is_numeric_dtype(df[stat]):
            mean_val = df[stat].mean()
            std_dev = df[stat].std()
            # Calculate z-score, handle division by zero or NaN std_dev
            if std_dev == 0 or pd.isna(std_dev):
                z_scores[f'{stat}_ZScore'] = 0.0
            else:
                z_scores[f'{stat}_ZScore'] = (df[stat] - mean_val) / std_dev
            print(f"    Calculated z-scores for '{stat}'. Mean: {mean_val:.2f}, StdDev: {std_dev:.2f}")
        else:
            print(f"    Warning: Column '{stat}' is not numeric. Skipping z-score calculation.")
            z_scores[f'{stat}_ZScore'] = np.nan  # Or some other placeholder
            
    # Concatenate the original DataFrame with the new z-score columns
    return pd.concat([df, z_scores], axis=1)

def main():
    """Main function to load data for all seasons, calculate z-scores, and save to a single combined file per season."""
    if not os.path.exists(BASE_OUTPUT_DIR):
        os.makedirs(BASE_OUTPUT_DIR)
        print(f"Created base output directory: {BASE_OUTPUT_DIR}")

    # Find all season data files (e.g., nba_stats_2023-24.csv)
    season_files = glob.glob(os.path.join(DATA_DIR, 'nba_stats_*-*.csv'))

    if not season_files:
        print(f"No season data files found in {DATA_DIR} matching pattern 'nba_stats_*-*.csv'.")
        print("Please run split_data_by_season.py first or ensure files are present.")
        return

    for season_file_path in season_files:
        filename = os.path.basename(season_file_path)
        # Extract season string like "2023-24" from "nba_stats_2023-24.csv"
        match = re.search(r'nba_stats_(\d{4}-\d{2})\.csv', filename)
        if not match:
            print(f"Could not extract season from filename: {filename}. Skipping.")
            continue
        season_str = match.group(1)
        
        print(f"\nProcessing season: {season_str} from file: {filename}")

        try:
            season_df = pd.read_csv(season_file_path)
        except Exception as e:
            print(f"  Error reading {season_file_path}: {e}. Skipping this season.")
            continue

        if 'PlayerName' not in season_df.columns:
            print(f"  'PlayerName' column not found in {filename}. Skipping this season.")
            continue
            
        # Calculate z-scores for all specified stats
        z_scores_df = calculate_z_scores_for_df(season_df, STATS_TO_NORMALIZE)
        
        output_filename = f"{season_str}_combined_z_scores.csv"
        output_filepath = os.path.join(BASE_OUTPUT_DIR, output_filename)
        
        try:
            z_scores_df.to_csv(output_filepath, index=False)
            print(f"  Successfully saved combined z-scores for season {season_str} to {output_filepath}")
        except Exception as e:
            print(f"  Error saving combined z-scores for season {season_str}: {e}")

    print("\nCombined z-score calculation process completed for all seasons.")

if __name__ == "__main__":
    main()
