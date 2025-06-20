import pandas as pd
import os

# --- Configuration ---
DATA_DIR = '../data'
SOURCE_FILENAME = 'nba_player_stats_last_10_years.csv'
SOURCE_FILE_PATH = os.path.join(DATA_DIR, SOURCE_FILENAME)

def split_dataframe_by_season(df):
    """
    Splits the main DataFrame into multiple DataFrames, one for each season.

    Args:
        df (pd.DataFrame): The DataFrame containing all player stats, with a 'Season' column.

    Returns:
        dict: A dictionary where keys are season strings (e.g., '2023-24') 
              and values are the corresponding DataFrames.
    """
    if 'Season' not in df.columns:
        print("Error: 'Season' column not found in the DataFrame.")
        return {}

    # Use groupby to create a dictionary of DataFrames
    grouped = df.groupby('Season')
    season_dfs = {season: group for season, group in grouped}
    
    print(f"Found {len(season_dfs)} unique seasons in the data.")
    return season_dfs

def save_season_dataframes(season_dfs, output_dir):
    """
    Saves each season's DataFrame to its own CSV file.

    Args:
        season_dfs (dict): A dictionary of season DataFrames.
        output_dir (str): The directory where the CSV files will be saved.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    for season, df in season_dfs.items():
        # Sanitize the season string to create a valid filename
        filename = f"nba_stats_{season}.csv"
        output_path = os.path.join(output_dir, filename)
        
        try:
            df.to_csv(output_path, index=False)
            print(f"Successfully saved data for season {season} to {output_path}")
        except Exception as e:
            print(f"Error saving data for season {season}: {e}")

def main():
    """Main function to load, split, and save the data."""
    # Check if the source file exists
    if not os.path.exists(SOURCE_FILE_PATH):
        print(f"Error: Source file not found at {SOURCE_FILE_PATH}")
        print("Please run the fetch_nba_data.py script first to generate the data.")
        return

    print(f"Loading data from {SOURCE_FILE_PATH}...")
    try:
        main_df = pd.read_csv(SOURCE_FILE_PATH)
    except Exception as e:
        print(f"Error reading the CSV file: {e}")
        return

    season_dataframes = split_dataframe_by_season(main_df)

    if season_dataframes:
        save_season_dataframes(season_dataframes, DATA_DIR)
        print("\nData splitting process completed.")

if __name__ == "__main__":
    main()
