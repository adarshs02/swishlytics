import pandas as pd

# Define the z-score columns to be used for the total fantasy score
# For stats where lower is better (e.g., Turnovers), we will invert their z-score contribution
Z_SCORE_COLUMNS = {
    'Points_ZScore':            1.195,   # Points
    'Rebounds_ZScore':          1.267,   # Rebounds
    'Assists_ZScore':           1.239,   # Assists
    'Steals_ZScore':            1.322,   # Steals
    'Blocks_ZScore':            1.426,   # Blocks
    'FieldGoalPct_ZScore':      1.380,   # Field-Goal %
    'ThreePointersMade_ZScore': 1.286,   # 3-Pointers Made
    'FreeThrowPct_ZScore':      1.256,   # Free-Throw %
    'Turnovers_ZScore':        -1.217    # Turnovers (penalty, stays negative)
}

def calculate_fantasy_scores(seasonal_dataframes):
    """
    Calculates a total fantasy z-score for each player by season, ranks them,
    and returns the updated DataFrames.

    Args:
        seasonal_dataframes (dict): A dictionary of pandas DataFrames, with seasons as keys.

    Returns:
        dict: A dictionary of pandas DataFrames with 'Swish_Score' and 'Overall_Rank' added.
    """
    print("Calculating fantasy scores and rankings...")
    processed_dataframes = {}

    for season, df in seasonal_dataframes.items():
        print(f"  Processing season: {season}...")
        
        # Calculate Swish Score
        df['Swish_Score'] = 0
        for col, multiplier in Z_SCORE_COLUMNS.items():
            if col in df.columns:
                df['Swish_Score'] += df[col] * multiplier
            else:
                print(f"    Warning: Z-score column '{col}' not found for season {season}. Skipping.")
        
        # Rank players based on Swish_Score (descending)
        df['Overall_Rank'] = df['Swish_Score'].rank(method='min', ascending=False).astype(int)
        
        # Sort by Overall_Rank
        processed_dataframes[season] = df.sort_values(by='Overall_Rank')

    print("Finished calculating fantasy scores.")
    return processed_dataframes

