import pandas as pd
import os

# Define the input and output base directories
INPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'combined_z_scores_by_season')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'total_fantasy_scores_by_season')

# Define the z-score columns to be used for the total fantasy score
# For stats where lower is better (e.g., Turnovers), we will invert their z-score contribution
Z_SCORE_COLUMNS = {
    'Points_ZScore': 1,      # Points
    'Rebounds_ZScore': 1,    # Rebounds
    'Assists_ZScore': 1,     # Assists
    'Steals_ZScore': 1,      # Steals
    'Blocks_ZScore': 1,      # Blocks
    'FieldGoalPct_ZScore': 1,# Field Goal Percentage
    'ThreePointPct_ZScore':1,# 3-Point Percentage
    'FreeThrowPct_ZScore':1, # Free Throw Percentage
    'Turnovers_ZScore': -1   # Turnovers (inverted)
}

def calculate_total_scores():
    """
    Calculates a total fantasy z-score for each player by season, ranks them,
    and saves the results to new CSV files.
    """
    print(f"Reading combined z-scores from: {INPUT_DIR}")
    print(f"Saving total fantasy scores to: {OUTPUT_DIR}")

    if not os.path.exists(INPUT_DIR):
        print(f"Error: Input directory not found: {INPUT_DIR}")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created output directory: {OUTPUT_DIR}")

    for filename in os.listdir(INPUT_DIR):
        if filename.endswith('_combined_z_scores.csv'):
            season_name = filename.replace('_combined_z_scores.csv', '')
            print(f"Processing season: {season_name}...")
            
            input_filepath = os.path.join(INPUT_DIR, filename)
            try:
                df = pd.read_csv(input_filepath)
            except FileNotFoundError:
                print(f"  Error: File not found {input_filepath}")
                continue
            except Exception as e:
                print(f"  Error reading {input_filepath}: {e}")
                continue

            # Calculate Total Fantasy Z-Score
            df['Total_Fantasy_ZScore'] = 0
            for col, multiplier in Z_SCORE_COLUMNS.items():
                if col in df.columns:
                    df['Total_Fantasy_ZScore'] += df[col] * multiplier
                else:
                    print(f"  Warning: Z-score column '{col}' not found in {filename}. Skipping for total score calculation.")
            
            # Rank players based on Total_Fantasy_ZScore (descending)
            df['Overall_Rank'] = df['Total_Fantasy_ZScore'].rank(method='min', ascending=False).astype(int)
            
            # Sort by Overall_Rank
            df = df.sort_values(by='Overall_Rank')
            
            output_filename = f"{season_name}_total_scores.csv"
            output_filepath = os.path.join(OUTPUT_DIR, output_filename)
            
            try:
                df.to_csv(output_filepath, index=False)
                print(f"  Successfully saved total scores to {output_filepath}")
            except Exception as e:
                print(f"  Error writing to {output_filepath}: {e}")

if __name__ == '__main__':
    calculate_total_scores()
    print("Finished calculating total fantasy scores.")

