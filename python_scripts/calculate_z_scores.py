import pandas as pd
import os
import numpy as np
import glob
import re # For extracting season string

# --- Configuration ---
DATA_DIR = '../data'
BASE_OUTPUT_DIR = os.path.join(DATA_DIR, 'z_scores_by_season')

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

def calculate_z_scores(df, stats):
    """
    Calculates z-scores for specified stats in a DataFrame.

    Args:
        df (pd.DataFrame): The input DataFrame with player stats.
        stats (list): A list of column names for which to calculate z-scores.

    Returns:
        pd.DataFrame: A new DataFrame with the original data plus z-score columns.
    """
    z_score_df = df.copy()
    for stat in stats:
        if stat not in df.columns:
            print(f"Warning: Column '{stat}' not found in DataFrame. Skipping z-score calculation for this stat.")
            continue
        if pd.api.types.is_numeric_dtype(df[stat]):
            mean_val = df[stat].mean()
            std_dev = df[stat].std()
            if std_dev == 0 or pd.isna(std_dev):
                z_score_df[f'{stat}_ZScore'] = 0.0
            else:
                z_score_df[f'{stat}_ZScore'] = (df[stat] - mean_val) / std_dev
            print(f"  Calculated z-scores for '{stat}'. Mean: {mean_val:.2f}, StdDev: {std_dev:.2f}")
        else:
            print(f"Warning: Column '{stat}' is not numeric. Skipping z-score calculation.")
            z_score_df[f'{stat}_ZScore'] = np.nan # Or some other placeholder
    return z_score_df

def main():
    """Main function to load data for all seasons, calculate z-scores, and save ranked stats to separate files."""
    if not os.path.exists(BASE_OUTPUT_DIR):
        os.makedirs(BASE_OUTPUT_DIR)
        print(f"Created base output directory: {BASE_OUTPUT_DIR}")

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

        season_output_dir = os.path.join(BASE_OUTPUT_DIR, season_str)
        if not os.path.exists(season_output_dir):
            os.makedirs(season_output_dir)
            print(f"Created season directory: {season_output_dir}")

        try:
            season_df = pd.read_csv(season_file_path)
        except Exception as e:
            print(f"Error reading {season_file_path}: {e}. Skipping this season.")
            continue

        if 'PlayerName' not in season_df.columns:
            print(f"'PlayerName' column not found in {filename}. Skipping this season.")
            continue
            
        z_scores_df = calculate_z_scores(season_df, STATS_TO_NORMALIZE)

        for stat_name in STATS_TO_NORMALIZE:
            z_score_col = f'{stat_name}_ZScore'
            if stat_name not in z_scores_df.columns or z_score_col not in z_scores_df.columns:
                print(f"  Skipping stat '{stat_name}' for season {season_str} as raw stat or ZScore column is missing.")
                continue

            # Create a DataFrame for the specific stat
            # Ensure PlayerName and the raw stat column are present
            if 'PlayerName' in z_scores_df.columns and stat_name in z_scores_df.columns:
                stat_specific_df = z_scores_df[['PlayerName', stat_name, z_score_col]].copy()
                
                # Calculate rank based on ZScore (higher ZScore = better rank, hence rank 1)
                stat_specific_df[f'{stat_name}_Rank'] = stat_specific_df[z_score_col].rank(method='min', ascending=False).astype(int)
                
                # Sort by rank
                stat_specific_df = stat_specific_df.sort_values(by=f'{stat_name}_Rank')
                
                output_stat_filename = f"{stat_name}_z_score_ranking.csv"
                output_stat_filepath = os.path.join(season_output_dir, output_stat_filename)
                
                try:
                    stat_specific_df.to_csv(output_stat_filepath, index=False)
                    print(f"  Successfully saved {stat_name} z-score rankings to {output_stat_filepath}")
                except Exception as e:
                    print(f"  Error saving {stat_name} z-score rankings for season {season_str}: {e}")
            else:
                print(f"  Could not create ranking for '{stat_name}' due to missing 'PlayerName' or '{stat_name}' column.")

    print("\nZ-score calculation and ranking process completed for all seasons.")

if __name__ == "__main__":
    main()
