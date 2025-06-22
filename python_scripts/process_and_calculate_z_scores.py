import pandas as pd
import numpy as np

# Stats to calculate z-scores for
STATS_FOR_Z_SCORES = [
    'Points', 'Rebounds', 'Assists', 'Steals', 'Blocks',
    'FieldGoalPct', 'ThreePointersMade', 'FreeThrowPct', 'Turnovers'
]

def calculate_z_scores_for_df(df, stats):
    """Calculates z-scores for specified stats and adds them to the DataFrame."""
    df_with_zscores = df.copy()
    for stat in stats:
        if stat in df_with_zscores.columns and pd.api.types.is_numeric_dtype(df_with_zscores[stat]):
            mean_val = df_with_zscores[stat].mean()
            std_dev = df_with_zscores[stat].std()
            if std_dev > 0:
                df_with_zscores[f'{stat}_ZScore'] = (df_with_zscores[stat] - mean_val) / std_dev
            else:
                df_with_zscores[f'{stat}_ZScore'] = 0.0
        else:
            df_with_zscores[f'{stat}_ZScore'] = np.nan
    return df_with_zscores

def process_and_calc_zscores(main_df):
    """Splits a DataFrame by season, calculates z-scores, and returns a dictionary of DataFrames."""
    print("Processing data and calculating z-scores by season...")

    if 'PlayerAge' not in main_df.columns:
        print("FATAL: 'PlayerAge' column not found in the source DataFrame.")
        return {}

    seasons = main_df['Season'].unique()
    print(f"  Found {len(seasons)} unique seasons.")

    seasonal_dataframes = {}
    for season in seasons:
        season_df = main_df[main_df['Season'] == season].copy()
        
        # This check is critical to ensure the column isn't lost during the split
        if 'PlayerAge' not in season_df.columns:
            print(f"  FATAL: 'PlayerAge' was dropped for season {season} during DataFrame split.")
            continue

        z_scores_df = calculate_z_scores_for_df(season_df, STATS_FOR_Z_SCORES)

        # Final check to ensure the column is still present after z-score calculation
        if 'PlayerAge' not in z_scores_df.columns:
            print(f"  FATAL: 'PlayerAge' was dropped for season {season} during z-score calculation.")
            continue

        seasonal_dataframes[season] = z_scores_df
        print(f"    -> Successfully processed season {season}")

    print("Finished processing and calculating z-scores.")
    return seasonal_dataframes
